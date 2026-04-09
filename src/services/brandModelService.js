const { Op } = require("sequelize");
const { BrandModel, Brand } = require("../models");
const brandService = require("./brandService");

function parseId(raw) {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) {
    const err = new Error("Invalid id");
    err.statusCode = 400;
    throw err;
  }
  return n;
}

function assertActorCanAddModelToBrand(actor, brand) {
  if (!brand) {
    const err = new Error("Brand not found");
    err.statusCode = 404;
    throw err;
  }
  if (actor.role === "SUPER_ADMIN") return;
  const oid = brandService.actorOrganisationId(actor);
  if (oid == null) {
    const err = new Error("Your account is not linked to an organisation");
    err.statusCode = 403;
    throw err;
  }
  if (brand.is_verified === true) return;
  const bo =
    brand.organisation_id != null ? parseInt(brand.organisation_id, 10) : null;
  if (bo != null && bo === oid) return;
  const err = new Error("You cannot add models to this brand");
  err.statusCode = 403;
  throw err;
}

function assertCanSeeBrandModel(actor, row) {
  if (!row) {
    const err = new Error("Brand model not found");
    err.statusCode = 404;
    throw err;
  }
  const brand = row.brand;
  brandService.assertCanSeeBrand(actor, brand);
  if (actor.role === "SUPER_ADMIN") return;
  const oid = brandService.actorOrganisationId(actor);
  if (row.is_verified === true) return;
  const mo =
    row.organisation_id != null ? parseInt(row.organisation_id, 10) : null;
  if (oid != null && mo != null && mo === oid) return;
  const err = new Error("Brand model not found");
  err.statusCode = 404;
  throw err;
}

const listBrandModels = async (actor, filters = {}, pagination = {}) => {
  const {
    search,
    brand_id: filterBrandId,
    pending_only: pendingOnly,
  } = filters;
  const page = parseInt(pagination.page, 10) || 1;
  const limit = Math.min(parseInt(pagination.limit, 10) || 50, 100);
  const offset = (page - 1) * limit;

  const andParts = [];
  if (filterBrandId) {
    const bid = parseInt(filterBrandId, 10);
    if (!Number.isNaN(bid) && bid >= 1) {
      andParts.push({ brand_id: bid });
    }
  }
  if (search) {
    andParts.push({
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ],
    });
  }

  const isSuper = actor.role === "SUPER_ADMIN";
  const includeBrand = {
    model: Brand,
    as: "brand",
    attributes: ["id", "name", "is_verified", "organisation_id"],
    required: true,
  };

  if (isSuper && pendingOnly === true) {
    andParts.push({ is_verified: false });
  } else if (!isSuper) {
    const oid = brandService.actorOrganisationId(actor);
    const modelOr = [{ is_verified: true }];
    if (oid != null) modelOr.push({ organisation_id: oid });
    const brandOr = [{ is_verified: true }];
    if (oid != null) brandOr.push({ organisation_id: oid });
    andParts.push({ [Op.or]: modelOr });
    includeBrand.where = { [Op.or]: brandOr };
  }

  const where = andParts.length ? { [Op.and]: andParts } : {};

  const { count, rows } = await BrandModel.findAndCountAll({
    where,
    limit,
    offset,
    order: [
      ["brand_id", "ASC"],
      ["name", "ASC"],
    ],
    include: [includeBrand],
    distinct: true,
    col: "id",
  });

  return {
    brand_models: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 0,
    },
  };
};

const createBrandModel = async (actor, payload) => {
  const brandId = parseInt(payload.brand_id, 10);
  const brand = await brandService.findBrandByPk(brandId);
  if (!brand) {
    const err = new Error("Brand not found");
    err.statusCode = 404;
    throw err;
  }
  assertActorCanAddModelToBrand(actor, brand);

  const isSuper = actor.role === "SUPER_ADMIN";
  const orgFromActor = brandService.actorOrganisationId(actor);

  if (isSuper) {
    return BrandModel.create({
      brand_id: brandId,
      name: String(payload.name).trim(),
      description:
        payload.description === undefined || payload.description === ""
          ? null
          : String(payload.description),
      is_verified: true,
      organisation_id: null,
    });
  }

  return BrandModel.create({
    brand_id: brandId,
    name: String(payload.name).trim(),
    description:
      payload.description === undefined || payload.description === ""
        ? null
        : String(payload.description),
    is_verified: false,
    organisation_id: orgFromActor,
  });
};

const getBrandModelById = async (actor, rawId) => {
  const id = parseId(rawId);
  const row = await BrandModel.findByPk(id, {
    include: [
      {
        model: Brand,
        as: "brand",
        attributes: ["id", "name", "logo", "is_verified", "organisation_id"],
      },
    ],
  });
  assertCanSeeBrandModel(actor, row);
  return row;
};

const updateBrandModel = async (actor, rawId, payload) => {
  const row = await getBrandModelById(actor, rawId);
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
  if (payload.brand_id !== undefined) {
    const brandId = parseInt(payload.brand_id, 10);
    if (Number.isNaN(brandId) || brandId < 1) {
      const err = new Error("brand_id must be a positive integer");
      err.statusCode = 400;
      throw err;
    }
    const brand = await brandService.findBrandByPk(brandId);
    assertActorCanAddModelToBrand(actor, brand);
    updates.brand_id = brandId;
  }
  if (Object.keys(updates).length === 0) {
    const err = new Error("No fields to update");
    err.statusCode = 400;
    throw err;
  }
  await row.update(updates);
  await row.reload({
    include: [
      {
        model: Brand,
        as: "brand",
        attributes: ["id", "name", "logo", "is_verified", "organisation_id"],
      },
    ],
  });
  assertCanSeeBrandModel(actor, row);
  return row;
};

const deleteBrandModel = async (actor, rawId) => {
  if (actor.role !== "SUPER_ADMIN") {
    const err = new Error("Only a super administrator can delete brand models");
    err.statusCode = 403;
    throw err;
  }
  const id = parseId(rawId);
  const row = await BrandModel.findByPk(id);
  if (!row) {
    const err = new Error("Brand model not found");
    err.statusCode = 404;
    throw err;
  }
  await row.destroy();
  return { success: true };
};

const verifyBrandModel = async (rawId) => {
  const id = parseId(rawId);
  const row = await BrandModel.findByPk(id);
  if (!row) {
    const err = new Error("Brand model not found");
    err.statusCode = 404;
    throw err;
  }
  await row.update({ is_verified: true, organisation_id: null });
  await row.reload({
    include: [
      {
        model: Brand,
        as: "brand",
        attributes: ["id", "name", "logo", "is_verified", "organisation_id"],
      },
    ],
  });
  return row;
};

module.exports = {
  listBrandModels,
  createBrandModel,
  getBrandModelById,
  updateBrandModel,
  deleteBrandModel,
  verifyBrandModel,
  assertCanSeeBrandModel,
};
