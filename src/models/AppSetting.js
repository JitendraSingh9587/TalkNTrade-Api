const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * AppSetting Model
 * Stores application-wide configuration settings
 */
const AppSetting = sequelize.define(
  'AppSetting',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: 'app_settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    charset: 'utf8mb4',
    indexes: [
      { fields: ['is_active'] },
    ],
  }
);

module.exports = AppSetting;
