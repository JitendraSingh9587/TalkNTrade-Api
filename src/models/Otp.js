const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Otp = sequelize.define(
  'Otp',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: 'User ID (null for REGISTER purpose before user creation)',
    },

    email: {
      type: DataTypes.STRING(191),
      allowNull: true,
      comment: 'Email address (used for REGISTER OTP when user_id is null)',
    },

    otp: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: 'Plain OTP (no encryption as per requirement)',
    },

    purpose: {
      type: DataTypes.ENUM(
        'LOGIN',
        'REGISTER',
        'FORGOT_PASSWORD',
        'VERIFY_MOBILE',
        'VERIFY_EMAIL'
      ),
      allowNull: false,
    },

    channel: {
      type: DataTypes.ENUM('SMS', 'EMAIL'),
      allowNull: false,
    },

    is_used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    attempts: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
      comment: 'Failed verification attempts',
    },

    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },

    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: 'user_otps',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    charset: 'utf8mb4',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['email'] },
      { fields: ['purpose'] },
      { fields: ['channel'] },
      { fields: ['is_used'] },
      { fields: ['expires_at'] },
      { fields: ['user_id', 'purpose', 'is_used'] }, // main lookup index
      { fields: ['email', 'purpose', 'is_used'] }, // lookup index for REGISTER OTPs
    ],
  }
);

module.exports = Otp;
