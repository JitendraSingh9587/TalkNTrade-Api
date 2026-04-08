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
    errors.push("Email or mobile number is required");
  }

  if (!data.password || data.password.length === 0) {
    errors.push("Password is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const FORGOT_PASSWORD_GENERIC_MESSAGE =
  "If an account exists for that email, you will receive password reset instructions shortly.";

/**
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validateForgotPassword = (data) => {
  const errors = [];
  if (!data.email || String(data.email).trim().length === 0) {
    errors.push("Email is required");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(data.email).trim())) {
      errors.push("Invalid email format");
    }
  }
  return { isValid: errors.length === 0, errors };
};

/**
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validateResetPassword = (data) => {
  const errors = [];
  if (!data.token || String(data.token).trim().length === 0) {
    errors.push("Reset token is required");
  }
  if (!data.password || String(data.password).length === 0) {
    errors.push("Password is required");
  } else if (String(data.password).length < 6) {
    errors.push("Password must be at least 6 characters");
  }
  return { isValid: errors.length === 0, errors };
};

module.exports = {
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  FORGOT_PASSWORD_GENERIC_MESSAGE,
};
