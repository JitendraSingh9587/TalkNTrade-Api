const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * UserSession Model
 * Represents user authentication sessions with access and refresh tokens
 */
const UserSession = sequelize.define(
  'UserSession',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },

    access_token_hash: {
      type: DataTypes.CHAR(64),
      allowNull: false,
    },

    refresh_token_hash: {
      type: DataTypes.CHAR(64),
      allowNull: false,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    revoked_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },

    access_token_expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    refresh_token_expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    device_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    device_type: {
      type: DataTypes.ENUM('WEB', 'MOBILE', 'TABLET'),
      allowNull: true,
    },

    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },

    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'user_sessions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    charset: 'utf8mb4',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['access_token_hash'] },
      { fields: ['is_active'] },
      { fields: ['refresh_token_expires_at'] },
    ],
  }
);

module.exports = UserSession;
