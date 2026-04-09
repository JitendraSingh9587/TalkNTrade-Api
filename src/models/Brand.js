const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Brand = sequelize.define(
  "Brand",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    logo: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    /** Super-admin–approved catalog entries are visible to all organisations. */
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    /** Organisation that submitted this brand (null = global / legacy). */
    organisation_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: "organisations", key: "id" },
    },
  },
  {
    tableName: "brands",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    charset: "utf8mb4",
    indexes: [{ fields: ["name"] }],
  },
);

module.exports = Brand;
