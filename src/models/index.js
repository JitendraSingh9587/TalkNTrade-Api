const { sequelize } = require('../config/database');
const User = require('./User');
const UserSession = require('./UserSession');
const AuditLog = require('./AuditLog');
const AppSetting = require('./AppSetting');
const defineRelationships = require('./relationships');

/**
 * Models directory
 * All database models are centralized here
 */

// Initialize relationships
defineRelationships();

module.exports = {
  sequelize,
  User,
  UserSession,
  AuditLog,
  AppSetting,
};
