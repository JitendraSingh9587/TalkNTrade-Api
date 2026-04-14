const { Op } = require("sequelize");
const { Invoice, Customer, Organisation } = require("../models");
const organisationService = require("./organisationService");
const { round2 } = require("../validators/invoiceValidator");

function parseId(raw) {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) {
    const err = new Error("Invalid id");
    err.statusCode = 400;
    throw err;
  }
  return n;
}

function num(v) {
  return Number(v);
}

function assertActorCanAccessOrg(actor, organisationId) {
  if (actor.role === "SUPER_ADMIN") return;
  const oid =
    actor.organisation_id != null ? parseInt(actor.organisation_id, 10) : null;
  if (oid != null && oid === parseInt(organisationId, 10)) return;
  const err = new Error("You cannot access this organisation's invoices");
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
      const err = new Error("organisation_id is required for this invoice");
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
  const err = new Error("You are not allowed to create invoices");
  err.statusCode = 403;
  throw err;
}

function assertAmountConsistency(total, discount, finalAmt) {
  const t = round2(num(total));
  const d = round2(num(discount));
  const f = round2(num(finalAmt));
  if (d > t + 0.02) {
    const err = new Error("discount_amount cannot exceed total_amount");
    err.statusCode = 400;
    throw err;
  }
  if (Math.abs(round2(t - d) - f) > 0.02) {
    const err = new Error(
      "final_amount must equal total_amount minus discount_amount (within 0.02)",
    );
    err.statusCode = 400;
    throw err;
  }
  return { total_amount: t, discount_amount: d, final_amount: f };
}

function derivePaidAndStatus(finalAmt, paidAmt) {
  const final = round2(num(finalAmt));
  let paid = round2(num(paidAmt));
  if (paid < 0) paid = 0;
  const remaining = Math.max(0, round2(final - paid));
  let payment_status;
  if (final <= 0) {
    payment_status = paid > 0.005 ? "PAID" : "UNPAID";
  } else if (paid + 1e-6 >= final) {
    payment_status = "PAID";
  } else if (paid > 0.005) {
    payment_status = "PARTIAL";
  } else {
    payment_status = "UNPAID";
  }
  return { paid_amount: paid, remaining_amount: remaining, payment_status };
}

async function assertCustomerBelongsToOrg(customerId, orgId) {
  const c = await Customer.findByPk(customerId);
  if (!c) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }
  if (parseInt(c.organisation_id, 10) !== parseInt(orgId, 10)) {
    const err = new Error("customer_id does not belong to this organisation");
    err.statusCode = 400;
    throw err;
  }
}

async function assertUniqueInvoiceNumber(orgId, invoiceNumber, excludeId) {
  const where = {
    organisation_id: orgId,
    invoice_number: invoiceNumber,
  };
  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }
  const existing = await Invoice.findOne({ where });
  if (existing) {
    const err = new Error("invoice_number already exists for this organisation");
    err.statusCode = 409;
    throw err;
  }
}

const customerInclude = {
  model: Customer,
  as: "customer",
  attributes: [
    "id",
    "full_name",
    "phone",
    "email",
    "company_name",
    "organisation_id",
  ],
};

const listInvoices = async (actor, query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;

  const orgWhere = resolveListOrganisationScope(actor, query);
  const where = { ...orgWhere };

  if (query.customer_id) {
    const cid = parseInt(query.customer_id, 10);
    if (!Number.isNaN(cid) && cid >= 1) where.customer_id = cid;
  }
  if (query.payment_status) {
    const s = String(query.payment_status).trim().toUpperCase();
    if (s === "PAID" || s === "PARTIAL" || s === "UNPAID") {
      where.payment_status = s;
    }
  }
  const search = query.search ? String(query.search).trim() : "";
  if (search) {
    where.invoice_number = { [Op.like]: `%${search}%` };
  }

  const { count, rows } = await Invoice.findAndCountAll({
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
      customerInclude,
    ],
  });

  return {
    invoices: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 0,
    },
  };
};

const createInvoice = async (actor, normalized, rawBody) => {
  const orgId = resolveOrganisationIdForCreate(actor, rawBody);
  await organisationService.requireActiveOrganisation(orgId);
  assertActorCanAccessOrg(actor, orgId);

  await assertCustomerBelongsToOrg(normalized.customer_id, orgId);
  await assertUniqueInvoiceNumber(orgId, normalized.invoice_number);

  const amounts = assertAmountConsistency(
    normalized.total_amount,
    normalized.discount_amount,
    normalized.final_amount,
  );
  const paidDerived = derivePaidAndStatus(
    amounts.final_amount,
    normalized.paid_amount,
  );

  return Invoice.create({
    organisation_id: orgId,
    invoice_number: normalized.invoice_number,
    customer_id: normalized.customer_id,
    total_amount: amounts.total_amount,
    discount_amount: amounts.discount_amount,
    final_amount: amounts.final_amount,
    paid_amount: paidDerived.paid_amount,
    remaining_amount: paidDerived.remaining_amount,
    payment_status: paidDerived.payment_status,
    payment_mode: normalized.payment_mode,
    notes: normalized.notes,
  });
};

const getInvoiceById = async (actor, rawId) => {
  const id = parseId(rawId);
  const row = await Invoice.findByPk(id, {
    include: [
      {
        model: Organisation,
        as: "organisation",
        attributes: ["id", "name"],
      },
      customerInclude,
    ],
  });
  if (!row) {
    const err = new Error("Invoice not found");
    err.statusCode = 404;
    throw err;
  }
  assertActorCanAccessOrg(actor, row.organisation_id);
  return row;
};

const updateInvoice = async (actor, rawId, normalized, _rawBody) => {
  const invoice = await Invoice.findByPk(parseId(rawId));
  if (!invoice) {
    const err = new Error("Invoice not found");
    err.statusCode = 404;
    throw err;
  }
  assertActorCanAccessOrg(actor, invoice.organisation_id);

  if (
    actor.role !== "SUPER_ADMIN" &&
    actor.role !== "ADMIN" &&
    actor.role !== "SUPERVISOR" &&
    actor.role !== "USER"
  ) {
    const err = new Error("You are not allowed to update invoices");
    err.statusCode = 403;
    throw err;
  }

  const orgId = invoice.organisation_id;
  const nextCustomerId = normalized.customer_id ?? invoice.customer_id;
  await assertCustomerBelongsToOrg(nextCustomerId, orgId);

  const nextNumber = normalized.invoice_number ?? invoice.invoice_number;
  if (nextNumber !== invoice.invoice_number) {
    await assertUniqueInvoiceNumber(orgId, nextNumber, invoice.id);
  }

  const total =
    normalized.total_amount !== undefined
      ? normalized.total_amount
      : invoice.total_amount;
  const discount =
    normalized.discount_amount !== undefined
      ? normalized.discount_amount
      : invoice.discount_amount;
  const finalAmt =
    normalized.final_amount !== undefined
      ? normalized.final_amount
      : invoice.final_amount;
  const amounts = assertAmountConsistency(total, discount, finalAmt);

  const paidRaw =
    normalized.paid_amount !== undefined
      ? normalized.paid_amount
      : invoice.paid_amount;
  const paidDerived = derivePaidAndStatus(amounts.final_amount, paidRaw);

  const payload = {
    invoice_number: nextNumber,
    customer_id: nextCustomerId,
    total_amount: amounts.total_amount,
    discount_amount: amounts.discount_amount,
    final_amount: amounts.final_amount,
    paid_amount: paidDerived.paid_amount,
    remaining_amount: paidDerived.remaining_amount,
    payment_status: paidDerived.payment_status,
    ...(normalized.payment_mode !== undefined
      ? { payment_mode: normalized.payment_mode }
      : {}),
    ...(normalized.notes !== undefined ? { notes: normalized.notes } : {}),
  };

  await invoice.update(payload);
  await invoice.reload({
    include: [
      {
        model: Organisation,
        as: "organisation",
        attributes: ["id", "name"],
      },
      customerInclude,
    ],
  });
  return invoice;
};

const deleteInvoice = async (actor, rawId) => {
  if (actor.role !== "SUPER_ADMIN" && actor.role !== "ADMIN") {
    const err = new Error("Only administrators can archive invoices");
    err.statusCode = 403;
    throw err;
  }

  const invoice = await Invoice.findByPk(parseId(rawId));
  if (!invoice) {
    const err = new Error("Invoice not found");
    err.statusCode = 404;
    throw err;
  }
  assertActorCanAccessOrg(actor, invoice.organisation_id);
  await invoice.destroy();
  return { success: true };
};

module.exports = {
  listInvoices,
  createInvoice,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
};
