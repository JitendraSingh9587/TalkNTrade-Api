const { Op } = require("sequelize");
const { Product, Brand, BrandModel, Organisation } = require("../models");
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
  const err = new Error("You cannot access this organisation's products");
  err.statusCode = 403;
  throw err;
}

function resolveListOrganisationScope(actor, query) {
  if (actor.role === "SUPER_ADMIN") {
    const raw = query.organisation_id;
    if (raw === undefined || raw === null || raw === "") {
      return {}; // all orgs
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
      const err = new Error("organisation_id is required for this product");
      err.statusCode = 400;
      throw err;
    }
    return n;
  }
  if (actor.role === "ADMIN") {
    if (!actor.organisation_id) {
      const err = new Error("Your account is not linked to an organisation");
      err.statusCode = 403;
      throw err;
    }
    return parseInt(actor.organisation_id, 10);
  }
  const err = new Error("Only administrators can create products");
  err.statusCode = 403;
  throw err;
}

async function resolveBrandModelNames(brandId, modelId) {
  const brand = await Brand.findByPk(brandId);
  if (!brand) {
    const err = new Error("Brand not found");
    err.statusCode = 404;
    throw err;
  }
  const bm = await BrandModel.findByPk(modelId);
  if (!bm) {
    const err = new Error("Brand model not found");
    err.statusCode = 404;
    throw err;
  }
  if (parseInt(bm.brand_id, 10) !== parseInt(brandId, 10)) {
    const err = new Error("model_id does not belong to the given brand_id");
    err.statusCode = 400;
    throw err;
  }
  return { brand_name: brand.name, model_name: bm.name };
}

const listProducts = async (actor, query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;

  const orgWhere = resolveListOrganisationScope(actor, query);
  const where = { ...orgWhere };

  if (query.is_sold !== undefined && query.is_sold !== "") {
    const v = String(query.is_sold).toLowerCase();
    if (v === "true" || v === "1") where.is_sold = true;
    else if (v === "false" || v === "0") where.is_sold = false;
  }
  if (query.brand_id) {
    const b = parseInt(query.brand_id, 10);
    if (!Number.isNaN(b) && b >= 1) where.brand_id = b;
  }
  if (query.model_id) {
    const m = parseInt(query.model_id, 10);
    if (!Number.isNaN(m) && m >= 1) where.model_id = m;
  }
  const search = query.search ? String(query.search).trim() : "";
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { imei_number: { [Op.like]: `%${search}%` } },
      { stock_reference: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Product.findAndCountAll({
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
    ],
  });

  return {
    products: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 0,
    },
  };
};

const createProduct = async (actor, normalized, rawBody) => {
  const orgId = resolveOrganisationIdForCreate(actor, rawBody);
  await organisationService.requireActiveOrganisation(orgId);
  assertActorCanAccessOrg(actor, orgId);

  const { brand_name, model_name } = await resolveBrandModelNames(
    normalized.brand_id,
    normalized.model_id,
  );

  const row = {
    organisation_id: orgId,
    ...normalized,
    brand_name,
    model_name,
  };

  if (row.is_sold && !row.sold_at) {
    row.sold_at = new Date();
  }
  if (!row.is_sold) {
    row.sold_at = null;
  }

  return Product.create(row);
};

const getProductById = async (actor, rawId) => {
  const id = parseId(rawId);
  const product = await Product.findByPk(id, {
    include: [
      {
        model: Organisation,
        as: "organisation",
        attributes: ["id", "name"],
      },
      { model: Brand, as: "brand", attributes: ["id", "name", "logo"] },
      {
        model: BrandModel,
        as: "brandModel",
        attributes: ["id", "name", "brand_id"],
      },
    ],
  });
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }
  assertActorCanAccessOrg(actor, product.organisation_id);
  return product;
};

const updateProduct = async (actor, rawId, normalized, rawBody) => {
  const product = await Product.findByPk(parseId(rawId));
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }
  assertActorCanAccessOrg(actor, product.organisation_id);

  if (actor.role !== "SUPER_ADMIN" && actor.role !== "ADMIN") {
    const err = new Error("Only administrators can update products");
    err.statusCode = 403;
    throw err;
  }

  const payload = { ...normalized };

  if (payload.brand_id !== undefined || payload.model_id !== undefined) {
    const brandId = payload.brand_id ?? product.brand_id;
    const modelId = payload.model_id ?? product.model_id;
    const names = await resolveBrandModelNames(brandId, modelId);
    payload.brand_name = names.brand_name;
    payload.model_name = names.model_name;
  }

  if (payload.is_sold === true) {
    if (payload.sold_at === undefined && !product.is_sold) {
      payload.sold_at = new Date();
    }
  }
  if (payload.is_sold === false) {
    payload.sold_at = null;
  }

  if (Object.keys(payload).length === 0) {
    const err = new Error("No fields to update");
    err.statusCode = 400;
    throw err;
  }

  await product.update(payload);
  await product.reload({
    include: [
      {
        model: Organisation,
        as: "organisation",
        attributes: ["id", "name"],
      },
      { model: Brand, as: "brand", attributes: ["id", "name", "logo"] },
      {
        model: BrandModel,
        as: "brandModel",
        attributes: ["id", "name", "brand_id"],
      },
    ],
  });
  return product;
};

const deleteProduct = async (actor, rawId) => {
  if (actor.role !== "SUPER_ADMIN" && actor.role !== "ADMIN") {
    const err = new Error("Only administrators can delete products");
    err.statusCode = 403;
    throw err;
  }

  const product = await Product.findByPk(parseId(rawId));
  if (!product) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }
  assertActorCanAccessOrg(actor, product.organisation_id);
  await product.destroy();
  return { success: true };
};

module.exports = {
  listProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
};
