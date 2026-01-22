const authService = require('../services/authService');
const { validateLogin } = require('../validators/authValidator');
const { sendSuccess, sendError } = require('../utils/response');

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
      return sendError(res, validation.errors.join(', '), 400);
    }

    const { identifier, password } = req.body;

    // Extract device information from request
    const deviceInfo = {
      device_id: req.body.device_id || null,
      device_type: req.body.device_type || null,
      user_agent: req.headers['user-agent'] || null,
      ip_address: req.ip || req.connection.remoteAddress || null,
    };

    const result = await authService.login(identifier, password, deviceInfo);
    
    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

module.exports = {
  login,
};
