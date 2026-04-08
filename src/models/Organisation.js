const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Organisation = sequelize.define(
  "Organisation",
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
    type: {
      type: DataTypes.ENUM(
        "COMPANY",
        "INDIVIDUAL",
        "NON_PROFIT",
        "GOVERNMENT",
        "OTHER",
      ),
      allowNull: false,
      defaultValue: "COMPANY",
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    logo_url: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    banner_url: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE", "SUSPENDED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
  },
  {
    tableName: "organisations",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    charset: "utf8mb4",
    indexes: [{ fields: ["status"] }, { fields: ["name"] }],
  },
);

module.exports = Organisation;
