const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

/**
 * Organisation-scoped inventory item (phone/device).
 * Denormalized brand_name / model_name kept in sync on write from Brand / BrandModel.
 */
const Product = sequelize.define(
  "Product",
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    brand_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: "brands", key: "id" },
    },
    brand_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    model_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: "brand_models", key: "id" },
    },
    model_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    variant: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    purchase_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    additional_charges: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0,
    },
    imei_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    network_type: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    minimum_selling_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    is_new: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    charger_available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    box_available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    warranty_available_time: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    warranty_duration: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    battery_percentage: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
    },
    issues: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    /** Array of image URLs (JSON) */
    product_images: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    purchased_from: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_sold: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    /** Set when marked sold (audit) */
    sold_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    /** Optional internal reference / SKU */
    stock_reference: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
  },
  {
    tableName: "products",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    charset: "utf8mb4",
    indexes: [
      { fields: ["organisation_id"] },
      { fields: ["brand_id"] },
      { fields: ["model_id"] },
      { fields: ["is_sold"] },
      { fields: ["imei_number"] },
    ],
  },
);

module.exports = Product;
