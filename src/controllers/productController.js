const productService = require("../services/productService");
const { validateProductPayload } = require("../validators/productValidator");
const { sendSuccess, sendError } = require("../utils/response");

const listProducts = async (req, res) => {
  try {
    const result = await productService.listProducts(req.user, req.query);
    sendSuccess(res, result, "Products retrieved successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const createProduct = async (req, res) => {
  try {
    const validation = validateProductPayload(req.body, { partial: false });
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(", "), 400);
    }
    const row = await productService.createProduct(
      req.user,
      validation.normalized,
      req.body,
    );
    sendSuccess(res, row, "Product created successfully", 201);
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const getProductById = async (req, res) => {
  try {
    const row = await productService.getProductById(req.user, req.params.id);
    sendSuccess(res, row, "Product retrieved successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const updateProduct = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return sendError(res, "No fields to update", 400);
    }
    const validation = validateProductPayload(req.body, { partial: true });
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(", "), 400);
    }
    const row = await productService.updateProduct(
      req.user,
      req.params.id,
      validation.normalized,
      req.body,
    );
    sendSuccess(res, row, "Product updated successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const result = await productService.deleteProduct(req.user, req.params.id);
    sendSuccess(res, result, "Product deleted successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

module.exports = {
  listProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
};
