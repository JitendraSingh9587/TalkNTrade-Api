const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

/**
 * User Model
 * Represents users in the system with roles and authentication
 */
const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,
    },

    mobile: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },

    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    role: {
      type: DataTypes.ENUM('SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'USER'),
      allowNull: false,
    },

    is_disabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    disabled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    disabled_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },

    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    charset: 'utf8mb4',
    indexes: [
      { fields: ['email'] },
      { fields: ['mobile'] },
      { fields: ['role'] },
      { fields: ['is_disabled'] },
    ],
  }
);

module.exports = User;
