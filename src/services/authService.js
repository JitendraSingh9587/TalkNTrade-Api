const { User, UserSession } = require('../models');
const { Op } = require('sequelize');
const { comparePassword } = require('../shared/utils/password');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getTokenExpiration,
} = require('../shared/utils/jwt');

/**
 * Auth Service
 * Contains authentication business logic
 */

/**
 * Login user with email/mobile and password
 * @param {string} identifier - Email or mobile number
 * @param {string} password - Plain text password
 * @param {Object} deviceInfo - Device information (optional)
 * @returns {Promise<Object>} User data with tokens
 */
const login = async (identifier, password, deviceInfo = {}) => {
  // Find user by email or mobile
  const user = await User.findOne({
    where: {
      [Op.or]: [
        { email: identifier },
        { mobile: identifier },
      ],
    },
  });

  if (!user) {
    const error = new Error('Invalid email/mobile or password');
    error.statusCode = 401;
    throw error;
  }

  // Check if user is disabled
  if (user.is_disabled) {
    const error = new Error('User account is disabled');
    error.statusCode = 403;
    throw error;
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email/mobile or password');
    error.statusCode = 401;
    throw error;
  }

  // Generate tokens
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload, '1h');
  const refreshToken = generateRefreshToken(tokenPayload, '7d');

  // Hash tokens for storage
  const accessTokenHash = hashToken(accessToken);
  const refreshTokenHash = hashToken(refreshToken);

  // Calculate expiration dates
  const accessTokenExpiresAt = getTokenExpiration(3600); // 1 hour
  const refreshTokenExpiresAt = getTokenExpiration(604800); // 7 days

  // Create user session
  await UserSession.create({
    user_id: user.id,
    access_token_hash: accessTokenHash,
    refresh_token_hash: refreshTokenHash,
    access_token_expires_at: accessTokenExpiresAt,
    refresh_token_expires_at: refreshTokenExpiresAt,
    device_id: deviceInfo.device_id || null,
    device_type: deviceInfo.device_type || null,
    user_agent: deviceInfo.user_agent || null,
    ip_address: deviceInfo.ip_address || null,
    is_active: true,
  });

  // Update last login time
  await user.update({
    last_login_at: new Date(),
  });

  // Return user data without password
  const userData = user.toJSON();
  delete userData.password;

  return {
    user: userData,
    tokens: {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    },
  };
};

module.exports = {
  login,
};
