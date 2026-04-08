const { sequelize } = require("../config/database");
const User = require("./User");
const Organisation = require("./Organisation");
const UserSession = require("./UserSession");
const AuditLog = require("./AuditLog");
const AppSetting = require("./AppSetting");
const Otp = require("./Otp");
const defineRelationships = require("./relationships");

/**
 * Models directory
 * All database models are centralized here
 */

// Initialize relationships
defineRelationships();

module.exports = {
  sequelize,
  User,
  Organisation,
  UserSession,
  AuditLog,
  AppSetting,
  Otp,
};
