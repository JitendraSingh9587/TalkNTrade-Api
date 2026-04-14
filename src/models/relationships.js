const User = require("./User");
const UserSession = require("./UserSession");
const Otp = require("./Otp");
const Organisation = require("./Organisation");
const PasswordResetToken = require("./PasswordResetToken");
const Media = require("./Media");
const Brand = require("./Brand");
const BrandModel = require("./BrandModel");
const Product = require("./Product");
const Customer = require("./Customer");

/**
 * Define model relationships
 */
const defineRelationships = () => {
  Organisation.hasMany(User, {
    foreignKey: "organisation_id",
    as: "users",
  });

  User.belongsTo(Organisation, {
    foreignKey: "organisation_id",
    as: "organisation",
  });

  // User has many UserSessions
  User.hasMany(UserSession, {
    foreignKey: "user_id",
    as: "sessions",
  });

  // UserSession belongs to User
  UserSession.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });

  // User has many OTPs
  User.hasMany(Otp, {
    foreignKey: "user_id",
    as: "otps",
  });

  // OTP belongs to User
  Otp.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });

  User.hasMany(PasswordResetToken, {
    foreignKey: "user_id",
    as: "passwordResetTokens",
  });

  PasswordResetToken.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });

  Organisation.hasMany(Media, {
    foreignKey: "organisation_id",
    as: "media",
  });

  Media.belongsTo(Organisation, {
    foreignKey: "organisation_id",
    as: "organisation",
  });

  Organisation.hasMany(Brand, {
    foreignKey: "organisation_id",
    as: "submittedBrands",
  });

  Brand.belongsTo(Organisation, {
    foreignKey: "organisation_id",
    as: "submittedByOrganisation",
  });

  Organisation.hasMany(BrandModel, {
    foreignKey: "organisation_id",
    as: "submittedBrandModels",
  });

  BrandModel.belongsTo(Organisation, {
    foreignKey: "organisation_id",
    as: "submittedByOrganisation",
  });

  Brand.hasMany(BrandModel, {
    foreignKey: "brand_id",
    as: "models",
  });

  BrandModel.belongsTo(Brand, {
    foreignKey: "brand_id",
    as: "brand",
  });

  Organisation.hasMany(Product, {
    foreignKey: "organisation_id",
    as: "products",
  });

  Product.belongsTo(Organisation, {
    foreignKey: "organisation_id",
    as: "organisation",
  });

  Brand.hasMany(Product, {
    foreignKey: "brand_id",
    as: "products",
  });

  Product.belongsTo(Brand, {
    foreignKey: "brand_id",
    as: "brand",
  });

  BrandModel.hasMany(Product, {
    foreignKey: "model_id",
    as: "products",
  });

  Product.belongsTo(BrandModel, {
    foreignKey: "model_id",
    as: "brandModel",
  });

  Organisation.hasMany(Customer, {
    foreignKey: "organisation_id",
    as: "customers",
  });

  Customer.belongsTo(Organisation, {
    foreignKey: "organisation_id",
    as: "organisation",
  });

  User.hasMany(Customer, {
    foreignKey: "assigned_to",
    as: "assignedCustomers",
  });

  Customer.belongsTo(User, {
    foreignKey: "assigned_to",
    as: "assignee",
  });
};

module.exports = defineRelationships;
