const brandModelService = require("../services/brandModelService");
const {
  validateBrandModelPayload,
} = require("../validators/brandModelValidator");
const { sendSuccess, sendError } = require("../utils/response");

const listBrandModels = async (req, res) => {
  try {
    const result = await brandModelService.listBrandModels(
      req.user,
      {
        search: req.query.search,
        brand_id: req.query.brand_id,
        pending_only: req.query.pending_only === "true",
      },
      { page: req.query.page, limit: req.query.limit },
    );
    sendSuccess(res, result, "Brand models retrieved successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const createBrandModel = async (req, res) => {
  try {
    const validation = validateBrandModelPayload(req.body, { partial: false });
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(", "), 400);
    }
    const row = await brandModelService.createBrandModel(req.user, req.body);
    sendSuccess(res, row, "Brand model created successfully", 201);
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const getBrandModelById = async (req, res) => {
  try {
    const row = await brandModelService.getBrandModelById(
      req.user,
      req.params.id,
    );
    sendSuccess(res, row, "Brand model retrieved successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const updateBrandModel = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return sendError(res, "No fields to update", 400);
    }
    const validation = validateBrandModelPayload(req.body, { partial: true });
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(", "), 400);
    }
    const row = await brandModelService.updateBrandModel(
      req.user,
      req.params.id,
      req.body,
    );
    sendSuccess(res, row, "Brand model updated successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const deleteBrandModel = async (req, res) => {
  try {
    const result = await brandModelService.deleteBrandModel(
      req.user,
      req.params.id,
    );
    sendSuccess(res, result, "Brand model deleted successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const verifyBrandModel = async (req, res) => {
  try {
    const row = await brandModelService.verifyBrandModel(req.params.id);
    sendSuccess(res, row, "Brand model verified successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

module.exports = {
  listBrandModels,
  createBrandModel,
  getBrandModelById,
  updateBrandModel,
  deleteBrandModel,
  verifyBrandModel,
};
