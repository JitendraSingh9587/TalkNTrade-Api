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

async function assertBrandExists(brandId) {
  await brandService.getBrandById(brandId);
}

const listBrandModels = async (filters = {}, pagination = {}) => {
  const { search, brand_id: filterBrandId } = filters;
  const page = parseInt(pagination.page, 10) || 1;
  const limit = Math.min(parseInt(pagination.limit, 10) || 50, 100);
  const offset = (page - 1) * limit;

  const where = {};
  if (filterBrandId) {
    const bid = parseInt(filterBrandId, 10);
    if (!Number.isNaN(bid) && bid >= 1) {
      where.brand_id = bid;
    }
  }
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await BrandModel.findAndCountAll({
    where,
    limit,
    offset,
    order: [
      ["brand_id", "ASC"],
      ["name", "ASC"],
    ],
    include: [
      {
        model: Brand,
        as: "brand",
        attributes: ["id", "name"],
      },
    ],
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

const createBrandModel = async (payload) => {
  const brandId = parseInt(payload.brand_id, 10);
  await assertBrandExists(brandId);
  return BrandModel.create({
    brand_id: brandId,
    name: String(payload.name).trim(),
    description:
      payload.description === undefined || payload.description === ""
        ? null
        : String(payload.description),
  });
};

const getBrandModelById = async (rawId) => {
  const id = parseId(rawId);
  const row = await BrandModel.findByPk(id, {
    include: [
      {
        model: Brand,
        as: "brand",
        attributes: ["id", "name", "logo"],
      },
    ],
  });
  if (!row) {
    const err = new Error("Brand model not found");
    err.statusCode = 404;
    throw err;
  }
  return row;
};

const updateBrandModel = async (rawId, payload) => {
  const row = await getBrandModelById(rawId);
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
    await assertBrandExists(brandId);
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
        attributes: ["id", "name", "logo"],
      },
    ],
  });
  return row;
};

const deleteBrandModel = async (rawId) => {
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

module.exports = {
  listBrandModels,
  createBrandModel,
  getBrandModelById,
  updateBrandModel,
  deleteBrandModel,
};
