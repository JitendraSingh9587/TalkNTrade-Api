const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

/**
 * Organisation-scoped customer record (CRM-style).
 * Soft-deleted only (`deleted_at`); rows remain in the database.
 */
const Customer = sequelize.define(
  "Customer",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    organisation_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: "organisations", key: "id" },
    },
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    alternate_phone: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    company_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    gst_number: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    /** Structured address (line1, city, state, postal_code, country, etc.) */
    address: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    customer_type: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: "RETAIL",
    },
    assigned_to: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "customers",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",
    charset: "utf8mb4",
    indexes: [
      { fields: ["organisation_id"] },
      { fields: ["phone"] },
      { fields: ["email"] },
      { fields: ["assigned_to"] },
      { fields: ["customer_type"] },
    ],
  },
);

module.exports = Customer;
