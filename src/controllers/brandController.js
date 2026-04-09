const brandService = require("../services/brandService");
const { validateBrandPayload } = require("../validators/brandValidator");
const { sendSuccess, sendError } = require("../utils/response");

const listBrands = async (req, res) => {
  try {
    const result = await brandService.listBrands(
      { search: req.query.search },
      { page: req.query.page, limit: req.query.limit },
    );
    sendSuccess(res, result, "Brands retrieved successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const createBrand = async (req, res) => {
  try {
    const validation = validateBrandPayload(req.body, { partial: false });
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(", "), 400);
    }
    const row = await brandService.createBrand(req.body);
    sendSuccess(res, row, "Brand created successfully", 201);
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const getBrandById = async (req, res) => {
  try {
    const row = await brandService.getBrandById(req.params.id);
    sendSuccess(res, row, "Brand retrieved successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const updateBrand = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return sendError(res, "No fields to update", 400);
    }
    const validation = validateBrandPayload(req.body, { partial: true });
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(", "), 400);
    }
    const row = await brandService.updateBrand(req.params.id, req.body);
    sendSuccess(res, row, "Brand updated successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const deleteBrand = async (req, res) => {
  try {
    const result = await brandService.deleteBrand(req.params.id);
    sendSuccess(res, result, "Brand deleted successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

module.exports = {
  listBrands,
  createBrand,
  getBrandById,
  updateBrand,
  deleteBrand,
};
