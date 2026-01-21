/**
 * Shared models index
 * Re-exports models from src/models/ for backward compatibility
 * 
 * Note: All models are now in src/models/ directory
 */

const {
  sequelize,
  User,
  UserSession,
  AuditLog,
  AppSetting,
} = require('../../models');

// Export sequelize instance and models
module.exports = {
  sequelize,
  User,
  UserSession,
  AuditLog,
  AppSetting,
};
