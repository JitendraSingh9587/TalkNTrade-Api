const { Op } = require("sequelize");
const { Customer, Organisation, User } = require("../models");
const organisationService = require("./organisationService");

function parseId(raw) {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) {
    const err = new Error("Invalid id");
    err.statusCode = 400;
    throw err;
  }
  return n;
}

function assertActorCanAccessOrg(actor, organisationId) {
  if (actor.role === "SUPER_ADMIN") return;
  const oid =
    actor.organisation_id != null ? parseInt(actor.organisation_id, 10) : null;
  if (oid != null && oid === parseInt(organisationId, 10)) return;
  const err = new Error("You cannot access this organisation's customers");
  err.statusCode = 403;
  throw err;
}

function resolveListOrganisationScope(actor, query) {
  if (actor.role === "SUPER_ADMIN") {
    const raw = query.organisation_id;
    if (raw === undefined || raw === null || raw === "") {
      return {};
    }
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < 1) {
      const err = new Error("Invalid organisation_id");
      err.statusCode = 400;
      throw err;
    }
    return { organisation_id: n };
  }
  const oid = actor.organisation_id;
  if (oid == null || oid === "") {
    const err = new Error("Your account is not linked to an organisation");
    err.statusCode = 403;
    throw err;
  }
  return { organisation_id: parseInt(oid, 10) };
}

function resolveOrganisationIdForCreate(actor, body) {
  if (actor.role === "SUPER_ADMIN") {
    const raw = body.organisation_id;
    const n = parseInt(raw, 10);
    if (
      raw === undefined ||
      raw === null ||
      raw === "" ||
      Number.isNaN(n) ||
      n < 1
    ) {
      const err = new Error("organisation_id is required for this customer");
      err.statusCode = 400;
      throw err;
    }
    return n;
  }
  if (
    actor.role === "ADMIN" ||
    actor.role === "SUPERVISOR" ||
    actor.role === "USER"
  ) {
    if (!actor.organisation_id) {
      const err = new Error("Your account is not linked to an organisation");
      err.statusCode = 403;
      throw err;
    }
    return parseInt(actor.organisation_id, 10);
  }
  const err = new Error("You are not allowed to create customers");
  err.statusCode = 403;
  throw err;
}

async function assertAssignableUser(orgId, userId) {
  if (userId == null) return;
  const u = await User.findByPk(userId, {
    attributes: ["id", "organisation_id", "is_disabled"],
  });
  if (!u || u.is_disabled) {
    const err = new Error("Assigned user not found or inactive");
    err.statusCode = 400;
    throw err;
  }
  if (parseInt(u.organisation_id, 10) !== parseInt(orgId, 10)) {
    const err = new Error("assigned_to must be a user in the same organisation");
    err.statusCode = 400;
    throw err;
  }
}

const assigneeInclude = {
  model: User,
  as: "assignee",
  attributes: ["id", "name", "email", "mobile"],
};

const listCustomers = async (actor, query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;

  const orgWhere = resolveListOrganisationScope(actor, query);
  const where = { ...orgWhere };

  if (query.customer_type) {
    const t = String(query.customer_type).trim().toUpperCase();
    if (t) where.customer_type = t;
  }
  if (query.is_verified !== undefined && query.is_verified !== "") {
    const v = String(query.is_verified).toLowerCase();
    if (v === "true" || v === "1") where.is_verified = true;
    else if (v === "false" || v === "0") where.is_verified = false;
  }
  const search = query.search ? String(query.search).trim() : "";
  if (search) {
    where[Op.or] = [
      { full_name: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { alternate_phone: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { company_name: { [Op.like]: `%${search}%` } },
      { gst_number: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Customer.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]],
    include: [
      {
        model: Organisation,
        as: "organisation",
        attributes: ["id", "name"],
      },
      assigneeInclude,
    ],
  });

  return {
    customers: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 0,
    },
  };
};

const createCustomer = async (actor, normalized, rawBody) => {
  const orgId = resolveOrganisationIdForCreate(actor, rawBody);
  await organisationService.requireActiveOrganisation(orgId);
  assertActorCanAccessOrg(actor, orgId);

  await assertAssignableUser(orgId, normalized.assigned_to ?? null);

  return Customer.create({ organisation_id: orgId, ...normalized });
};

const getCustomerById = async (actor, rawId) => {
  const id = parseId(rawId);
  const customer = await Customer.findByPk(id, {
    include: [
      {
        model: Organisation,
        as: "organisation",
        attributes: ["id", "name"],
      },
      assigneeInclude,
    ],
  });
  if (!customer) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }
  assertActorCanAccessOrg(actor, customer.organisation_id);
  return customer;
};

const updateCustomer = async (actor, rawId, normalized, _rawBody) => {
  const customer = await Customer.findByPk(parseId(rawId));
  if (!customer) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }
  assertActorCanAccessOrg(actor, customer.organisation_id);

  if (
    actor.role !== "SUPER_ADMIN" &&
    actor.role !== "ADMIN" &&
    actor.role !== "SUPERVISOR" &&
    actor.role !== "USER"
  ) {
    const err = new Error("You are not allowed to update customers");
    err.statusCode = 403;
    throw err;
  }

  const orgId = customer.organisation_id;
  if (normalized.assigned_to !== undefined) {
    await assertAssignableUser(orgId, normalized.assigned_to);
  }

  const payload = { ...normalized };
  if (Object.keys(payload).length === 0) {
    const err = new Error("No fields to update");
    err.statusCode = 400;
    throw err;
  }

  await customer.update(payload);
  await customer.reload({
    include: [
      {
        model: Organisation,
        as: "organisation",
        attributes: ["id", "name"],
      },
      assigneeInclude,
    ],
  });
  return customer;
};

const deleteCustomer = async (actor, rawId) => {
  if (actor.role !== "SUPER_ADMIN" && actor.role !== "ADMIN") {
    const err = new Error("Only administrators can archive customers");
    err.statusCode = 403;
    throw err;
  }

  const customer = await Customer.findByPk(parseId(rawId));
  if (!customer) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }
  assertActorCanAccessOrg(actor, customer.organisation_id);
  await customer.destroy();
  return { success: true };
};

/**
 * Users in an organisation for assignee dropdown (editors only).
 */
const listAssignableUsers = async (actor, query) => {
  if (
    actor.role !== "SUPER_ADMIN" &&
    actor.role !== "ADMIN" &&
    actor.role !== "SUPERVISOR" &&
    actor.role !== "USER"
  ) {
    const err = new Error("You are not allowed to list assignable users");
    err.statusCode = 403;
    throw err;
  }

  let orgId;
  if (actor.role === "SUPER_ADMIN") {
    const raw = query.organisation_id;
    const n = parseInt(raw, 10);
    if (raw === undefined || raw === null || raw === "" || Number.isNaN(n) || n < 1) {
      const err = new Error("organisation_id is required");
      err.statusCode = 400;
      throw err;
    }
    orgId = n;
    assertActorCanAccessOrg(actor, orgId);
  } else {
    if (!actor.organisation_id) {
      const err = new Error("Your account is not linked to an organisation");
      err.statusCode = 403;
      throw err;
    }
    orgId = parseInt(actor.organisation_id, 10);
  }

  await organisationService.requireActiveOrganisation(orgId);

  const users = await User.findAll({
    where: {
      organisation_id: orgId,
      is_disabled: false,
    },
    attributes: ["id", "name", "email", "mobile", "role"],
    order: [["name", "ASC"]],
    limit: 300,
  });

  return { users };
};

function digitsOnly(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function addressesEqual(a, b) {
  return JSON.stringify(a || {}) === JSON.stringify(b || {});
}

function customerRowDiffersFromNormalized(existing, normalized) {
  if (String(existing.full_name || "") !== String(normalized.full_name || "")) {
    return true;
  }
  if (String(existing.phone || "").trim() !== String(normalized.phone || "").trim()) {
    return true;
  }
  if (String(existing.email || "") !== String(normalized.email || "")) {
    return true;
  }
  if (String(existing.alternate_phone || "") !== String(normalized.alternate_phone || "")) {
    return true;
  }
  if (String(existing.company_name || "") !== String(normalized.company_name || "")) {
    return true;
  }
  if (String(existing.gst_number || "") !== String(normalized.gst_number || "")) {
    return true;
  }
  if (String(existing.customer_type || "") !== String(normalized.customer_type || "")) {
    return true;
  }
  if (String(existing.notes || "") !== String(normalized.notes || "")) {
    return true;
  }
  if (Boolean(existing.is_verified) !== Boolean(normalized.is_verified)) {
    return true;
  }
  const a1 = existing.assigned_to != null ? parseInt(existing.assigned_to, 10) : null;
  const a2 =
    normalized.assigned_to != null ? parseInt(normalized.assigned_to, 10) : null;
  if (a1 !== a2) return true;
  if (!addressesEqual(existing.address, normalized.address)) return true;
  return false;
}

/**
 * Find customer by same mobile digits within org; create or update if fields changed.
 * @param {object} opts
 * @param {import("sequelize").Transaction} [opts.transaction]
 */
const upsertCustomerByMobileForOrg = async (actor, orgId, normalized, opts = {}) => {
  const { transaction } = opts;
  assertActorCanAccessOrg(actor, orgId);
  await organisationService.requireActiveOrganisation(orgId);
  await assertAssignableUser(orgId, normalized.assigned_to ?? null);

  const targetDigits = digitsOnly(normalized.phone);
  if (targetDigits.length < 8) {
    const err = new Error("phone must include at least 8 digits");
    err.statusCode = 400;
    throw err;
  }

  const candidates = await Customer.findAll({
    where: { organisation_id: orgId },
    ...(transaction ? { transaction } : {}),
    limit: 5000,
  });
  const existing = candidates.find((c) => digitsOnly(c.phone) === targetDigits);

  if (!existing) {
    const c = await Customer.create(
      { organisation_id: orgId, ...normalized },
      { transaction },
    );
    return { customer: c, created: true, updated: false };
  }

  if (!customerRowDiffersFromNormalized(existing, normalized)) {
    return { customer: existing, created: false, updated: false };
  }

  await existing.update(
    {
      full_name: normalized.full_name,
      phone: String(normalized.phone).trim(),
      email: normalized.email,
      alternate_phone: normalized.alternate_phone,
      company_name: normalized.company_name,
      gst_number: normalized.gst_number,
      address: normalized.address,
      customer_type: normalized.customer_type,
      assigned_to: normalized.assigned_to,
      notes: normalized.notes,
      is_verified: normalized.is_verified,
    },
    { transaction },
  );
  await existing.reload({ transaction });
  return { customer: existing, created: false, updated: true };
};

module.exports = {
  listCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  listAssignableUsers,
  upsertCustomerByMobileForOrg,
};
