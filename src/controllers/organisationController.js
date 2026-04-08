const organisationService = require("../services/organisationService");
const {
  validateOrganisationPayload,
} = require("../validators/organisationValidator");
const { sendSuccess, sendError } = require("../utils/response");

const listOrganisations = async (req, res) => {
  try {
    const result = await organisationService.listOrganisations(
      {
        search: req.query.search,
        status: req.query.status,
      },
      { page: req.query.page, limit: req.query.limit },
    );
    sendSuccess(res, result, "Organisations retrieved successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const createOrganisation = async (req, res) => {
  try {
    const validation = validateOrganisationPayload(req.body, {
      partial: false,
    });
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(", "), 400);
    }
    const org = await organisationService.createOrganisation(req.body);
    sendSuccess(res, org, "Organisation created successfully", 201);
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const getOrganisationById = async (req, res) => {
  try {
    const org = await organisationService.getOrganisationById(req.params.id);
    sendSuccess(res, org, "Organisation retrieved successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const updateOrganisation = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return sendError(res, "No fields to update", 400);
    }
    const validation = validateOrganisationPayload(req.body, {
      partial: true,
    });
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(", "), 400);
    }
    const org = await organisationService.updateOrganisation(
      req.params.id,
      req.body,
    );
    sendSuccess(res, org, "Organisation updated successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const deleteOrganisation = async (req, res) => {
  try {
    const result = await organisationService.deleteOrganisation(req.params.id);
    sendSuccess(res, result, "Organisation deleted successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

module.exports = {
  listOrganisations,
  createOrganisation,
  getOrganisationById,
  updateOrganisation,
  deleteOrganisation,
};
