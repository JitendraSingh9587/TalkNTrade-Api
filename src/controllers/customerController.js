const customerService = require("../services/customerService");
const { validateCustomerPayload } = require("../validators/customerValidator");
const { sendSuccess, sendError } = require("../utils/response");

const listCustomers = async (req, res) => {
  try {
    const result = await customerService.listCustomers(req.user, req.query);
    sendSuccess(res, result, "Customers retrieved successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const listAssignableUsers = async (req, res) => {
  try {
    const result = await customerService.listAssignableUsers(req.user, req.query);
    sendSuccess(res, result, "Users retrieved successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const createCustomer = async (req, res) => {
  try {
    const validation = validateCustomerPayload(req.body, { partial: false });
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(", "), 400);
    }
    const row = await customerService.createCustomer(
      req.user,
      validation.normalized,
      req.body,
    );
    sendSuccess(res, row, "Customer created successfully", 201);
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const getCustomerById = async (req, res) => {
  try {
    const row = await customerService.getCustomerById(req.user, req.params.id);
    sendSuccess(res, row, "Customer retrieved successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const updateCustomer = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return sendError(res, "No fields to update", 400);
    }
    const validation = validateCustomerPayload(req.body, { partial: true });
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(", "), 400);
    }
    const row = await customerService.updateCustomer(
      req.user,
      req.params.id,
      validation.normalized,
      req.body,
    );
    sendSuccess(res, row, "Customer updated successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const result = await customerService.deleteCustomer(req.user, req.params.id);
    sendSuccess(res, result, "Customer archived successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const lookupCustomerByPhone = async (req, res) => {
  try {
    const result = await customerService.lookupCustomerByPhone(req.user, req.query);
    sendSuccess(res, result, "Lookup completed");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

module.exports = {
  listCustomers,
  listAssignableUsers,
  lookupCustomerByPhone,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
