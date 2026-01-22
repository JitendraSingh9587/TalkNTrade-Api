/**
 * Auth validation schemas
 */

/**
 * Validate login data
 * @param {Object} data - Login data to validate
 * @returns {Object} Validation result { isValid, errors }
 */
const validateLogin = (data) => {
  const errors = [];

  if (!data.identifier || data.identifier.trim().length === 0) {
    errors.push('Email or mobile number is required');
  }

  if (!data.password || data.password.length === 0) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateLogin,
};
