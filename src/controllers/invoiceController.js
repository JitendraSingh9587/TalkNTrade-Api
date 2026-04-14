const invoiceService = require("../services/invoiceService");
const { validateInvoicePayload } = require("../validators/invoiceValidator");
const { sendSuccess, sendError } = require("../utils/response");

const listInvoices = async (req, res) => {
  try {
    const result = await invoiceService.listInvoices(req.user, req.query);
    sendSuccess(res, result, "Invoices retrieved successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const createInvoice = async (req, res) => {
  try {
    const validation = validateInvoicePayload(req.body, { partial: false });
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(", "), 400);
    }
    const row = await invoiceService.createInvoice(
      req.user,
      validation.normalized,
      req.body,
    );
    sendSuccess(res, row, "Invoice created successfully", 201);
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const row = await invoiceService.getInvoiceById(req.user, req.params.id);
    sendSuccess(res, row, "Invoice retrieved successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const updateInvoice = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return sendError(res, "No fields to update", 400);
    }
    const validation = validateInvoicePayload(req.body, { partial: true });
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(", "), 400);
    }
    if (Object.keys(validation.normalized).length === 0) {
      return sendError(res, "No valid fields to update", 400);
    }
    const row = await invoiceService.updateInvoice(
      req.user,
      req.params.id,
      validation.normalized,
      req.body,
    );
    sendSuccess(res, row, "Invoice updated successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const result = await invoiceService.deleteInvoice(req.user, req.params.id);
    sendSuccess(res, result, "Invoice archived successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

module.exports = {
  listInvoices,
  createInvoice,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
};
