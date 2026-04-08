const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

/**
 * One-time token for password reset (plain token is emailed; only SHA-256 hash is stored).
 */
const PasswordResetToken = sequelize.define(
  "PasswordResetToken",
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
    token_hash: {
      type: DataTypes.CHAR(64),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "password_reset_tokens",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    charset: "utf8mb4",
    indexes: [
      { unique: true, fields: ["token_hash"] },
      { fields: ["user_id"] },
      { fields: ["expires_at"] },
    ],
  },
);

module.exports = PasswordResetToken;
