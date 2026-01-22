const authService = require('../services/authService');
const { validateLogin } = require('../validators/authValidator');
const { sendSuccess, sendError } = require('../utils/response');
const { expiryStringToSeconds, getTokenExpiry } = require('../shared/utils/jwt');

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
    
    // Get token expiry for cookie expiration
    const accessTokenExpiry = getTokenExpiry('ACCESS_TOKEN_EXPIRY', '7d');
    const refreshTokenExpiry = getTokenExpiry('REFRESH_TOKEN_EXPIRY', '7d');
    
    const accessTokenExpirySeconds = expiryStringToSeconds(accessTokenExpiry);
    const refreshTokenExpirySeconds = expiryStringToSeconds(refreshTokenExpiry);
    
    // Set cookies with tokens
    res.cookie('accessToken', result.tokens.accessToken, {
      httpOnly: true, // Prevent XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: accessTokenExpirySeconds * 1000, // Convert to milliseconds
      path: '/',
    });
    
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true, // Prevent XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: refreshTokenExpirySeconds * 1000, // Convert to milliseconds
      path: '/',
    });
    
    sendSuccess(res, result, 'Login successful');
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
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
      }
    }
    
    // If token exists, delete session from database
    if (accessToken) {
      await authService.logout(accessToken);
    }
    
    // Clear cookies regardless of token presence
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    
    sendSuccess(res, { success: true }, 'Logout successful');
  } catch (error) {
    // Even if there's an error, clear cookies
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    
    sendError(res, error.message, error.statusCode || 500);
  }
};

module.exports = {
  login,
  logout,
};
