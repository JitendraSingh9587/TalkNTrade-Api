const fs = require("fs");
const authService = require("../services/authService");
const userService = require("../services/userService");
const organisationService = require("../services/organisationService");
const localMediaStorage = require("../services/localMediaStorage");
const mediaService = require("../services/mediaService");
const { User, Organisation } = require("../models");
const { validateLogin } = require("../validators/authValidator");
const { validateUpdateUser } = require("../validators/userValidator");
const {
  validateOrganisationPayload,
} = require("../validators/organisationValidator");
const { sendSuccess, sendError } = require("../utils/response");
const {
  expiryStringToSeconds,
  getTokenExpiry,
} = require("../shared/utils/jwt");
const organisationSetupUploadService = require("../services/organisationSetupUploadService");

const AVATAR_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function tryRemoveOldUserAvatarFile(avatarUrl, userId) {
  if (!avatarUrl || typeof avatarUrl !== "string") return;
  const m = avatarUrl.match(/\/api\/v1\/media\/user-avatar\/(\d+)\/([^/?#]+)$/i);
  if (!m) return;
  if (parseInt(m[1], 10) !== parseInt(userId, 10)) return;
  try {
    const storage_key = `user_avatars/${m[1]}/${m[2]}`.replace(/\\/g, "/");
    localMediaStorage.removeFile(storage_key);
  } catch {
    /* ignore */
  }
}

/**
 * Auth Controller
 * Handles HTTP requests and responses for authentication operations
 */

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    // Validate request data
    const validation = validateLogin(req.body);
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(", "), 400);
    }

    const { identifier, password } = req.body;

    // Extract device information from request
    const deviceInfo = {
      device_id: req.body.device_id || null,
      device_type: req.body.device_type || null,
      user_agent: req.headers["user-agent"] || null,
      ip_address: req.ip || req.connection.remoteAddress || null,
    };

    const result = await authService.login(identifier, password, deviceInfo);

    // Get token expiry for cookie expiration
    const accessTokenExpiry = getTokenExpiry("ACCESS_TOKEN_EXPIRY", "7d");
    const refreshTokenExpiry = getTokenExpiry("REFRESH_TOKEN_EXPIRY", "7d");

    const accessTokenExpirySeconds = expiryStringToSeconds(accessTokenExpiry);
    const refreshTokenExpirySeconds = expiryStringToSeconds(refreshTokenExpiry);

    // Set cookies with tokens
    res.cookie("accessToken", result.tokens.accessToken, {
      httpOnly: true, // Prevent XSS attacks
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict", // CSRF protection
      maxAge: accessTokenExpirySeconds * 1000, // Convert to milliseconds
      path: "/",
    });

    res.cookie("refreshToken", result.tokens.refreshToken, {
      httpOnly: true, // Prevent XSS attacks
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict", // CSRF protection
      maxAge: refreshTokenExpirySeconds * 1000, // Convert to milliseconds
      path: "/",
    });

    sendSuccess(res, result, "Login successful");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * Logout user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logout = async (req, res) => {
  try {
    // Get token from cookie or Authorization header
    let accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      // Try to get from Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        accessToken = authHeader.substring(7);
      }
    }

    // If token exists, delete session from database
    if (accessToken) {
      await authService.logout(accessToken);
    }

    // Clear cookies regardless of token presence
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    sendSuccess(res, { success: true }, "Logout successful");
  } catch (error) {
    // Even if there's an error, clear cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * Validate JWT and return current user (requires authenticate middleware)
 */
const verifyToken = async (req, res) => {
  sendSuccess(res, { valid: true, user: req.user }, "Token valid");
};

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Organisation,
          as: "organisation",
          attributes: ["id", "name", "status"],
        },
      ],
    });
    if (!user) {
      return sendError(res, "User not found", 404);
    }
    sendSuccess(res, user.toJSON(), "Profile loaded");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const updateMe = async (req, res) => {
  try {
    const allowed = ["name", "mobile", "password", "avatar_url"];
    const payload = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) payload[k] = req.body[k];
    }
    if (payload.password !== undefined && !String(payload.password).trim()) {
      delete payload.password;
    }
    const validation = validateUpdateUser(payload);
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(", "), 400);
    }
    let prevAvatarUrl = null;
    if (payload.avatar_url === null) {
      const row = await User.findByPk(req.user.id, {
        attributes: ["avatar_url"],
      });
      prevAvatarUrl = row?.avatar_url || null;
    }
    const user = await userService.updateUser(
      req.user.id,
      payload,
      req.user.id,
      {
        id: req.user.id,
        role: req.user.role,
        organisation_id: req.user.organisation_id,
      },
    );
    if (payload.avatar_url === null && prevAvatarUrl) {
      tryRemoveOldUserAvatarFile(prevAvatarUrl, req.user.id);
    }
    sendSuccess(res, user, "Profile updated");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const uploadMyAvatar = async (req, res) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) {
      return sendError(res, "file is required (multipart field: file)", 400);
    }
    const mime = String(file.mimetype || "").toLowerCase();
    if (!AVATAR_IMAGE_MIMES.has(mime)) {
      return sendError(
        res,
        "Only JPEG, PNG, WebP, or GIF images are allowed",
        400,
      );
    }
    const max = mediaService.getMaxUploadBytes();
    if (file.size > max) {
      return sendError(res, `File too large. Maximum size is ${max} bytes`, 400);
    }

    const userRow = await User.findByPk(req.user.id);
    if (!userRow) {
      return sendError(res, "User not found", 404);
    }

    const prevUrl = userRow.avatar_url;
    const { absolutePath, filename } = localMediaStorage.allocateUserAvatarPath(
      req.user.id,
      mime,
      file.originalname,
    );
    try {
      fs.writeFileSync(absolutePath, file.buffer);
    } catch {
      return sendError(res, "Could not store uploaded file", 500);
    }

    const avatarPath = `/api/v1/media/user-avatar/${req.user.id}/${filename}`;
    await userRow.update({ avatar_url: avatarPath });

    tryRemoveOldUserAvatarFile(prevUrl, req.user.id);

    const refreshed = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Organisation,
          as: "organisation",
          attributes: ["id", "name", "status"],
        },
      ],
    });
    sendSuccess(res, refreshed.toJSON(), "Profile photo updated");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * ADMIN without organisation: create org and link account (after email signup).
 */
/**
 * ADMIN without organisation: upload logo/banner for setup (stored under uploads/.../org_setup/).
 */
const uploadOrganisationSetupAsset = async (req, res) => {
  try {
    const kind = req.body?.kind != null ? String(req.body.kind) : "";
    const data = await organisationSetupUploadService.saveUpload(
      req.file,
      kind,
      req.user,
    );
    sendSuccess(res, data, "File uploaded successfully", 201);
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const completeOrganisation = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN" || req.user.organisation_id) {
      return sendError(
        res,
        "Only admins without an organisation can complete this step",
        400,
      );
    }
    const validation = validateOrganisationPayload(req.body, {
      partial: false,
    });
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(", "), 400);
    }
    const org = await organisationService.createOrganisation(req.body);
    await User.update(
      { organisation_id: org.id },
      { where: { id: req.user.id } },
    );
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Organisation,
          as: "organisation",
          attributes: ["id", "name", "status"],
        },
      ],
    });
    const userData = user.toJSON();
    sendSuccess(
      res,
      { organisation: org, user: userData },
      "Organisation created and linked to your account",
    );
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

module.exports = {
  login,
  logout,
  verifyToken,
  getMe,
  updateMe,
  uploadMyAvatar,
  uploadOrganisationSetupAsset,
  completeOrganisation,
};
