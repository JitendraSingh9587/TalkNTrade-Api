const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * JWT utility functions
 */

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload (user data)
 * @param {string} expiresIn - Token expiration (default: 1h)
 * @returns {string} JWT token
 */
const generateAccessToken = (payload, expiresIn = '1h') => {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - Token payload (user data)
 * @param {string} expiresIn - Token expiration (default: 7d)
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (payload, expiresIn = '7d') => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-refresh-secret-key-change-in-production';
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify JWT access token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  return jwt.verify(token, secret);
};

/**
 * Verify JWT refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-refresh-secret-key-change-in-production';
  return jwt.verify(token, secret);
};

/**
 * Generate hash for token (for storing in database)
 * @param {string} token - JWT token
 * @returns {string} SHA256 hash of token
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Calculate token expiration date
 * @param {number} expiresInSeconds - Expiration time in seconds
 * @returns {Date} Expiration date
 */
const getTokenExpiration = (expiresInSeconds) => {
  return new Date(Date.now() + expiresInSeconds * 1000);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  getTokenExpiration,
};
