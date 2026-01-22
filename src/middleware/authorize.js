/**
 * Authorization Middleware
 * Checks if user has required role(s) to access the route
 */

/**
 * Authorize user based on roles
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      const error = new Error('Authentication required');
      error.statusCode = 401;
      return next(error);
    }

    // Check if user role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      const error = new Error('Access denied. Insufficient permissions.');
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};

module.exports = {
  authorize,
};
