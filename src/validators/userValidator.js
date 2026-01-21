/**
 * User validation schemas
 * Add validation logic here (e.g., using Joi, express-validator, etc.)
 */

/**
 * Validate user creation data
 * @param {Object} data - User data to validate
 * @returns {Object} Validation result { isValid, errors }
 */
const validateCreateUser = (data) => {
  const errors = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  } else if (data.name.length > 150) {
    errors.push('Name must be less than 150 characters');
  }

  if (!data.email || data.email.trim().length === 0) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format');
    }
    if (data.email.length > 191) {
      errors.push('Email must be less than 191 characters');
    }
  }

  if (!data.mobile || data.mobile.trim().length === 0) {
    errors.push('Mobile number is required');
  } else if (data.mobile.length > 20) {
    errors.push('Mobile number must be less than 20 characters');
  }

  if (!data.password || data.password.length === 0) {
    errors.push('Password is required');
  } else if (data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (!data.role) {
    errors.push('Role is required');
  } else {
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'USER'];
    if (!validRoles.includes(data.role)) {
      errors.push(`Role must be one of: ${validRoles.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate user update data
 * @param {Object} data - User data to validate
 * @returns {Object} Validation result { isValid, errors }
 */
const validateUpdateUser = (data) => {
  const errors = [];

  if (data.name !== undefined) {
    if (data.name.trim().length === 0) {
      errors.push('Name cannot be empty');
    } else if (data.name.length > 150) {
      errors.push('Name must be less than 150 characters');
    }
  }

  if (data.email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format');
    }
    if (data.email.length > 191) {
      errors.push('Email must be less than 191 characters');
    }
  }

  if (data.mobile !== undefined) {
    if (data.mobile.trim().length === 0) {
      errors.push('Mobile number cannot be empty');
    } else if (data.mobile.length > 20) {
      errors.push('Mobile number must be less than 20 characters');
    }
  }

  if (data.password !== undefined && data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (data.role !== undefined) {
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'USER'];
    if (!validRoles.includes(data.role)) {
      errors.push(`Role must be one of: ${validRoles.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateCreateUser,
  validateUpdateUser,
};
