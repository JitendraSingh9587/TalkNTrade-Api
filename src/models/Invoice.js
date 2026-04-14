const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

/**
 * Organisation-scoped invoice linked to a customer.
 * Soft delete via `deleted_at` only.
 */
const Invoice = sequelize.define(
  "Invoice",
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
    invoice_number: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: "customers", key: "id" },
    },
    /** Optional link when invoice is created from a product sale */
    product_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: "products", key: "id" },
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    final_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    paid_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    remaining_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    payment_status: {
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: "UNPAID",
    },
    payment_mode: {
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: "CASH",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "invoices",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",
    charset: "utf8mb4",
    indexes: [
      { unique: true, fields: ["organisation_id", "invoice_number"] },
      { fields: ["organisation_id"] },
      { fields: ["customer_id"] },
      { fields: ["product_id"] },
      { fields: ["payment_status"] },
      { fields: ["created_at"] },
    ],
  },
);

module.exports = Invoice;
