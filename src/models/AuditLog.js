const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * AuditLog Model
 * Tracks all system actions and changes for auditing purposes
 */
const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    actor_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },

    actor_role: {
      type: DataTypes.ENUM(
        'SUPER_ADMIN',
        'ADMIN',
        'SUPERVISOR',
        'USER',
        'SYSTEM'
      ),
      allowNull: false,
    },

    target_user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },

    target_type: {
      type: DataTypes.ENUM('USER', 'SESSION', 'ROLE', 'SYSTEM'),
      allowNull: false,
    },

    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    previous_data: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    new_data: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },

    device_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: 'audit_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    charset: 'utf8mb4',
    indexes: [
      { fields: ['actor_id'] },
      { fields: ['target_user_id'] },
      { fields: ['action'] },
      { fields: ['created_at'] },
    ],
  }
);

module.exports = AuditLog;
