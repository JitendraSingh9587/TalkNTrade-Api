const { sequelize } = require('../../config/database');

/**
 * Shared models index
 * Import and export all models here
 * Models are organized by modules in src/modules/{moduleName}/models/
 */

// Example: Import models from modules
// const { User } = require('../../modules/users/models/User');
// const { Product } = require('../../modules/products/models/Product');

// Export sequelize instance and models
module.exports = {
  sequelize,
  // User,
  // Product,
};
