const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const settingsCache = require('../services/settingsCache');

/**
 * JWT utility functions
 * Uses settings cache for JWT secrets (loaded from database)
 */

/**
 * Get JWT secret from settings cache or fallback to env
 * @param {string} key - Secret key name (JWT_SECRET or JWT_REFRESH_SECRET)
 * @param {string} fallback - Fallback value if not found
 * @returns {string} JWT secret
 */
const getJWTSecret = (key, fallback) => {
  // Try to get from settings cache first
  const cachedSecret = settingsCache.getSetting(key);
  if (cachedSecret) {
    return cachedSecret;
  }
  
  // Fallback to environment variable
  if (process.env[key]) {
    return process.env[key];
  }
  
  // Final fallback
  return fallback || 'your-secret-key-change-in-production';
};

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload (user data)
 * @param {string} expiresIn - Token expiration (default: 1h)
 * @returns {string} JWT token
 */
const generateAccessToken = (payload, expiresIn = '1h') => {
  const secret = getJWTSecret('JWT_SECRET', 'your-secret-key-change-in-production');
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - Token payload (user data)
 * @param {string} expiresIn - Token expiration (default: 7d)
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (payload, expiresIn = '7d') => {
  const secret = getJWTSecret('JWT_REFRESH_SECRET', getJWTSecret('JWT_SECRET', 'your-refresh-secret-key-change-in-production'));
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify JWT access token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  const secret = getJWTSecret('JWT_SECRET', 'your-secret-key-change-in-production');
  return jwt.verify(token, secret);
};

/**
 * Verify JWT refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  const secret = getJWTSecret('JWT_REFRESH_SECRET', getJWTSecret('JWT_SECRET', 'your-refresh-secret-key-change-in-production'));
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
