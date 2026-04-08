const { Op } = require("sequelize");
const { Organisation } = require("../models");

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
    status: payload.status || "ACTIVE",
  });
  return row;
};

module.exports = {
  listOrganisations,
  createOrganisation,
  requireActiveOrganisation,
};
