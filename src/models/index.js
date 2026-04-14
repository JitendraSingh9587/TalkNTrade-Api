const { sequelize } = require("../config/database");
const User = require("./User");
const Organisation = require("./Organisation");
const UserSession = require("./UserSession");
const AuditLog = require("./AuditLog");
const AppSetting = require("./AppSetting");
const Otp = require("./Otp");
const PasswordResetToken = require("./PasswordResetToken");
const Media = require("./Media");
const Brand = require("./Brand");
const BrandModel = require("./BrandModel");
const Product = require("./Product");
const Customer = require("./Customer");
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
  PasswordResetToken,
  Media,
  Brand,
  BrandModel,
  Product,
  Customer,
};
