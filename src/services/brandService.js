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

const listBrands = async (filters = {}, pagination = {}) => {
  const { search } = filters;
  const page = parseInt(pagination.page, 10) || 1;
  const limit = Math.min(parseInt(pagination.limit, 10) || 50, 100);
  const offset = (page - 1) * limit;

  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
    ];
  }

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

const createBrand = async (payload) => {
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
  });
};

const getBrandById = async (rawId) => {
  const id = parseId(rawId);
  const brand = await Brand.findByPk(id);
  if (!brand) {
    const err = new Error("Brand not found");
    err.statusCode = 404;
    throw err;
  }
  return brand;
};

const updateBrand = async (rawId, payload) => {
  const brand = await getBrandById(rawId);
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

const deleteBrand = async (rawId) => {
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

module.exports = {
  listBrands,
  createBrand,
  getBrandById,
  updateBrand,
  deleteBrand,
};
