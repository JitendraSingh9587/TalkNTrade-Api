const { Op } = require("sequelize");
const { Brand, BrandModel } = require("../models");

function parseId(raw) {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) {
    const err = new Error("Invalid id");
    err.statusCode = 400;
    throw err;
  }
  return n;
}

function actorOrganisationId(actor) {
  if (!actor || actor.role === "SUPER_ADMIN") return null;
  const n = parseInt(actor.organisation_id, 10);
  return Number.isNaN(n) ? null : n;
}

function assertCanSeeBrand(actor, brand) {
  if (!brand) {
    const err = new Error("Brand not found");
    err.statusCode = 404;
    throw err;
  }
  if (actor.role === "SUPER_ADMIN") return;
  const oid = actorOrganisationId(actor);
  if (brand.is_verified === true) return;
  const submitted =
    brand.organisation_id != null ? parseInt(brand.organisation_id, 10) : null;
  if (oid != null && submitted != null && submitted === oid) return;
  const err = new Error("Brand not found");
  err.statusCode = 404;
  throw err;
}

const listBrands = async (actor, filters = {}, pagination = {}) => {
  const { search, pending_only: pendingOnly } = filters;
  const page = parseInt(pagination.page, 10) || 1;
  const limit = Math.min(parseInt(pagination.limit, 10) || 50, 100);
  const offset = (page - 1) * limit;

  const andParts = [];
  if (search) {
    andParts.push({
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ],
    });
  }

  const isSuper = actor.role === "SUPER_ADMIN";
  if (isSuper && pendingOnly === true) {
    andParts.push({ is_verified: false });
  } else if (!isSuper) {
    const oid = actorOrganisationId(actor);
    const orConds = [{ is_verified: true }];
    if (oid != null) orConds.push({ organisation_id: oid });
    andParts.push({ [Op.or]: orConds });
  }

  const where = andParts.length ? { [Op.and]: andParts } : {};

  const { count, rows } = await Brand.findAndCountAll({
    where,
    limit,
    offset,
    order: [["name", "ASC"]],
  });

  return {
    brands: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 0,
    },
  };
};

const createBrand = async (actor, payload) => {
  const isSuper = actor.role === "SUPER_ADMIN";
  const orgFromActor = actorOrganisationId(actor);
  if (!isSuper) {
    if (orgFromActor == null) {
      const err = new Error("Your account is not linked to an organisation");
      err.statusCode = 403;
      throw err;
    }
    return Brand.create({
      name: String(payload.name).trim(),
      description:
        payload.description === undefined || payload.description === ""
          ? null
          : String(payload.description),
      logo:
        payload.logo === undefined ||
        payload.logo === "" ||
        payload.logo == null
          ? null
          : String(payload.logo).trim(),
      is_verified: false,
      organisation_id: orgFromActor,
    });
  }
  return Brand.create({
    name: String(payload.name).trim(),
    description:
      payload.description === undefined || payload.description === ""
        ? null
        : String(payload.description),
    logo:
      payload.logo === undefined || payload.logo === "" || payload.logo == null
        ? null
        : String(payload.logo).trim(),
    is_verified: true,
    organisation_id: null,
  });
};

const getBrandById = async (actor, rawId) => {
  const id = parseId(rawId);
  const brand = await Brand.findByPk(id);
  assertCanSeeBrand(actor, brand);
  return brand;
};

const updateBrand = async (actor, rawId, payload) => {
  const brand = await getBrandById(actor, rawId);
  const updates = {};
  if (payload.name !== undefined) {
    updates.name = String(payload.name).trim();
  }
  if (payload.description !== undefined) {
    updates.description =
      payload.description === null || payload.description === ""
        ? null
        : String(payload.description);
  }
  if (payload.logo !== undefined) {
    updates.logo =
      payload.logo === null || payload.logo === ""
        ? null
        : String(payload.logo).trim();
  }
  if (Object.keys(updates).length === 0) {
    const err = new Error("No fields to update");
    err.statusCode = 400;
    throw err;
  }
  await brand.update(updates);
  await brand.reload();
  return brand;
};

const deleteBrand = async (actor, rawId) => {
  if (actor.role !== "SUPER_ADMIN") {
    const err = new Error("Only a super administrator can delete brands");
    err.statusCode = 403;
    throw err;
  }
  const id = parseId(rawId);
  const brand = await Brand.findByPk(id);
  if (!brand) {
    const err = new Error("Brand not found");
    err.statusCode = 404;
    throw err;
  }
  await BrandModel.destroy({ where: { brand_id: id } });
  await brand.destroy();
  return { success: true };
};

/**
 * Super-admin only (route-enforced). Approves brand for all organisations.
 */
const verifyBrand = async (rawId) => {
  const id = parseId(rawId);
  const brand = await Brand.findByPk(id);
  if (!brand) {
    const err = new Error("Brand not found");
    err.statusCode = 404;
    throw err;
  }
  await brand.update({ is_verified: true, organisation_id: null });
  await brand.reload();
  return brand;
};

/** Internal: existence check without visibility rules (for FK checks). */
const findBrandByPk = async (id) => Brand.findByPk(id);

module.exports = {
  listBrands,
  createBrand,
  getBrandById,
  updateBrand,
  deleteBrand,
  verifyBrand,
  findBrandByPk,
  assertCanSeeBrand,
  actorOrganisationId,
};
