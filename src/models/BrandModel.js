const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

/**
 * Product line / SKU model under a brand (table: brand_models).
 * Sequelize model name BrandModel — not the Sequelize Model class.
 */
const BrandModel = sequelize.define(
  "BrandModel",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    brand_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: "brands", key: "id" },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "brand_models",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    charset: "utf8mb4",
    indexes: [{ fields: ["brand_id"] }, { fields: ["name"] }],
  },
);

module.exports = BrandModel;
