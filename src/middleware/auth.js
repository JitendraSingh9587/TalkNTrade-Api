const { verifyAccessToken } = require('../shared/utils/jwt');
const { User } = require('../models');

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
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      const error = new Error('Authentication required. Please provide a valid token.');
      error.statusCode = 401;
      return next(error);
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      const authError = new Error('Invalid or expired token');
      authError.statusCode = 401;
      return next(authError);
    }

    // Get user from database to ensure user still exists and is active
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      return next(error);
    }

    if (user.is_disabled) {
      const error = new Error('User account is disabled');
      error.statusCode = 403;
      return next(error);
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
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
