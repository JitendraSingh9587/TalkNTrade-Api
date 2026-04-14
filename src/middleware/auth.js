const { Op } = require("sequelize");
const { verifyAccessToken, hashToken } = require("../shared/utils/jwt");
const { User, UserSession, Organisation } = require("../models");

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */

/**
 * Authenticate user by verifying JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.accessToken;

    if (!token) {
      // Try to get from Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      const error = new Error(
        "Authentication required. Please provide a valid token.",
      );
      error.statusCode = 401;
      return next(error);
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      const authError = new Error("Invalid or expired token");
      authError.statusCode = 401;
      return next(authError);
    }

    // Get user from database to ensure user still exists and is active
    const user = await User.findByPk(decoded.id, {
      include: [
        {
          model: Organisation,
          as: "organisation",
          attributes: ["id", "name", "status"],
        },
      ],
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 401;
      return next(error);
    }

    if (user.is_disabled) {
      const error = new Error("User account is disabled");
      error.statusCode = 403;
      return next(error);
    }

    const pathOnly = req.originalUrl.split("?")[0].replace(/\/$/, "") || "/";
    const isPendingOrgAdmin = user.role === "ADMIN" && !user.organisation_id;

    if (isPendingOrgAdmin) {
      const allowedPending =
        (req.method === "GET" && pathOnly === "/api/v1/auth/verify") ||
        (req.method === "GET" && pathOnly === "/api/v1/auth/me") ||
        (req.method === "PUT" && pathOnly === "/api/v1/auth/me") ||
        (req.method === "POST" && pathOnly === "/api/v1/auth/me/avatar") ||
        (req.method === "POST" &&
          pathOnly === "/api/v1/auth/complete-organisation") ||
        (req.method === "POST" &&
          pathOnly === "/api/v1/auth/organisation-setup/upload");
      if (!allowedPending) {
        const error = new Error(
          "Complete your organisation setup to continue.",
        );
        error.statusCode = 403;
        return next(error);
      }
    } else if (user.role !== "SUPER_ADMIN") {
      if (!user.organisation_id) {
        const error = new Error(
          "Your account must be linked to an organisation. Contact support.",
        );
        error.statusCode = 403;
        return next(error);
      }
      const org = user.organisation;
      if (!org || org.status !== "ACTIVE") {
        const error = new Error("Your organisation is not active");
        error.statusCode = 403;
        return next(error);
      }
    }

    // Require a matching active session (JWT alone is not enough — revokes stale tokens)
    const accessTokenHash = hashToken(token);
    const session = await UserSession.findOne({
      where: {
        user_id: user.id,
        access_token_hash: accessTokenHash,
        is_active: true,
        access_token_expires_at: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!session) {
      const error = new Error(
        "Session invalid or revoked. Please sign in again.",
      );
      error.statusCode = 401;
      return next(error);
    }

    const org = user.organisation;
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      mobile: user.mobile,
      avatar_url: user.avatar_url ?? null,
      organisation_id: user.organisation_id,
      organisation: org
        ? { id: org.id, name: org.name, status: org.status }
        : null,
    };

    req.token = token;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
};
