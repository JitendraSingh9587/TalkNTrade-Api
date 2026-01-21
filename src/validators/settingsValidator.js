/**
 * Settings validation schemas
 */

/**
 * Validate setting creation data
 * @param {Object} data - Setting data to validate
 * @returns {Object} Validation result { isValid, errors }
 */
const validateCreateSetting = (data) => {
  const errors = [];

  if (!data.key || data.key.trim().length === 0) {
    errors.push('Key is required');
  } else if (data.key.length > 100) {
    errors.push('Key must be less than 100 characters');
  }

  if (!data.value || data.value.toString().trim().length === 0) {
    errors.push('Value is required');
  }

  if (data.description && data.description.length > 255) {
    errors.push('Description must be less than 255 characters');
  }

  // is_active is optional, defaults to true in database
  // Only validate if provided
  if (data.is_active !== undefined && typeof data.is_active !== 'boolean') {
    errors.push('is_active must be a boolean value');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate setting update data
 * @param {Object} data - Setting data to validate
 * @returns {Object} Validation result { isValid, errors }
 */
const validateUpdateSetting = (data) => {
  const errors = [];

  if (data.key !== undefined) {
    if (data.key.trim().length === 0) {
      errors.push('Key cannot be empty');
    } else if (data.key.length > 100) {
      errors.push('Key must be less than 100 characters');
    }
  }

  if (data.value !== undefined) {
    if (data.value.toString().trim().length === 0) {
      errors.push('Value cannot be empty');
    }
  }

  if (data.description !== undefined && data.description.length > 255) {
    errors.push('Description must be less than 255 characters');
  }

  if (data.is_active !== undefined && typeof data.is_active !== 'boolean') {
    errors.push('is_active must be a boolean value');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateCreateSetting,
  validateUpdateSetting,
};
