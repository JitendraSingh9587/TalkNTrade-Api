const path = require("path");
const mediaService = require("../services/mediaService");
const { validateMediaMetadata } = require("../validators/mediaValidator");
const { sendSuccess, sendError } = require("../utils/response");

const createMedia = async (req, res) => {
  try {
    const partial = validateMediaMetadata(
      {
        name: req.body.name,
        description: req.body.description,
        organisation_id: req.body.organisation_id,
      },
      { partial: true },
    );
    if (!partial.isValid) {
      return sendError(res, partial.errors.join(", "), 400);
    }

    const data = await mediaService.createFromUploadedFile(
      req.file,
      req.user,
      req.body,
    );
    sendSuccess(res, data, "Media uploaded successfully", 201);
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const listMedia = async (req, res) => {
  try {
    const result = await mediaService.listMedia(req.user, {
      page: req.query.page,
      limit: req.query.limit,
      organisation_id: req.query.organisation_id,
    });
    sendSuccess(res, result, "Media listed successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const getMedia = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return sendError(res, "Invalid id", 400);
    }
    const data = await mediaService.getMediaById(id, req.user);
    sendSuccess(res, data, "Media retrieved successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const updateMedia = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return sendError(res, "Invalid id", 400);
    }
    const validation = validateMediaMetadata(req.body, { partial: true });
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(", "), 400);
    }
    if (req.body.name === undefined && req.body.description === undefined) {
      return sendError(res, "Provide name and/or description to update", 400);
    }
    const data = await mediaService.updateMedia(id, req.body, req.user);
    sendSuccess(res, data, "Media updated successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const deleteMedia = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return sendError(res, "Invalid id", 400);
    }
    const data = await mediaService.deleteMedia(id, req.user);
    sendSuccess(res, data, "Media deleted successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * Public: stream file by id (no auth).
 */
const servePublicMedia = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return sendError(res, "Not found", 404);
    }
    const { media, absolutePath } = await mediaService.getPublicFilePayload(id);
    res.setHeader("Content-Type", media.type || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(media.name)}"`,
    );
    res.sendFile(path.resolve(absolutePath), (err) => {
      if (err && !res.headersSent) {
        sendError(res, "Not found", 404);
      }
    });
  } catch (error) {
    const code = error.statusCode || 500;
    if (code === 404) {
      return sendError(res, "Not found", 404);
    }
    sendError(res, error.message, code);
  }
};

module.exports = {
  createMedia,
  listMedia,
  getMedia,
  updateMedia,
  deleteMedia,
  servePublicMedia,
};
