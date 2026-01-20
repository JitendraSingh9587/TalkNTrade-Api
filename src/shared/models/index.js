const { sequelize } = require('../../config/database');

/**
 * Shared models index
 * Import and export all models here
 * Models are organized by modules in src/modules/{moduleName}/models/
 */

const { User, UserSession } = require('../../modules/users/models');
const { AuditLog } = require('../../modules/audit/models');

// Export sequelize instance and models
module.exports = {
  sequelize,
  User,
  UserSession,
  AuditLog,
};
