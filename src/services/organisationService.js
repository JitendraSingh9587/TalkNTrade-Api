const { Op } = require("sequelize");
const { Organisation, User } = require("../models");

/**
 * @param {number|string} id
 * @returns {Promise<import('sequelize').Model>}
 */
const requireActiveOrganisation = async (id) => {
  const org = await Organisation.findByPk(id);
  if (!org) {
    const error = new Error("Organisation not found");
    error.statusCode = 404;
    throw error;
  }
  if (org.status !== "ACTIVE") {
    const error = new Error("Organisation is not active");
    error.statusCode = 400;
    throw error;
  }
  return org;
};

const listOrganisations = async (filters = {}, pagination = {}) => {
  const { search, status } = filters;
  const page = parseInt(pagination.page, 10) || 1;
  const limit = parseInt(pagination.limit, 10) || 50;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) {
    where.status = status;
  }
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { gst_number: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Organisation.findAndCountAll({
    where,
    limit,
    offset,
    order: [["name", "ASC"]],
  });

  return {
    organisations: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 0,
    },
  };
};

/**
 * Normalise payload for Organisation.create
 */
const createOrganisation = async (payload) => {
  const row = await Organisation.create({
    name: String(payload.name).trim(),
    type: payload.type || "COMPANY",
    address: payload.address ?? null,
    phone: payload.phone ?? null,
    email: payload.email ?? null,
    website: payload.website ?? null,
    logo_url: payload.logo_url ?? null,
    banner_url: payload.banner_url ?? null,
    description: payload.description ?? null,
    gst_number:
      payload.gst_number != null && String(payload.gst_number).trim() !== ""
        ? String(payload.gst_number).trim()
        : null,
    status: payload.status || "ACTIVE",
  });
  return row;
};

const getOrganisationById = async (id) => {
  const org = await Organisation.findByPk(id);
  if (!org) {
    const error = new Error("Organisation not found");
    error.statusCode = 404;
    throw error;
  }
  return org;
};

const updateOrganisation = async (id, payload) => {
  const org = await getOrganisationById(id);
  const allowed = [
    "name",
    "type",
    "address",
    "phone",
    "email",
    "website",
    "logo_url",
    "banner_url",
    "description",
    "gst_number",
    "status",
  ];
  const updates = {};
  for (const key of allowed) {
    if (payload[key] !== undefined) {
      updates[key] = payload[key];
    }
  }
  if (updates.name !== undefined) {
    updates.name = String(updates.name).trim();
  }
  if (updates.gst_number !== undefined) {
    const g = updates.gst_number;
    updates.gst_number =
      g == null || String(g).trim() === "" ? null : String(g).trim();
  }
  if (Object.keys(updates).length === 0) {
    return org;
  }
  await org.update(updates);
  return org.reload();
};

const deleteOrganisation = async (id) => {
  const org = await getOrganisationById(id);
  const userCount = await User.count({
    where: { organisation_id: id },
  });
  if (userCount > 0) {
    const error = new Error(
      `Cannot delete organisation: ${userCount} user(s) are still assigned. Remove or reassign users first.`,
    );
    error.statusCode = 409;
    throw error;
  }
  await org.destroy();
  return { deleted: true, id: parseInt(id, 10) };
};

module.exports = {
  listOrganisations,
  createOrganisation,
  getOrganisationById,
  updateOrganisation,
  deleteOrganisation,
  requireActiveOrganisation,
};
