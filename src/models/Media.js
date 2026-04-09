const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

/**
 * Uploaded file metadata; binary lives on disk under MEDIA_STORAGE_ROOT / storage_key.
 */
const Media = sequelize.define(
  "Media",
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
    /**
     * Opaque token for public URL (stable; not tied to display name).
     * Path: /api/v1/media/public/{public_token}
     */
    public_token: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
    },
    /** Public path pattern, e.g. /api/v1/media/public/{public_token} */
    url: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
    /** MIME type */
    type: {
      type: DataTypes.STRING(127),
      allowNull: false,
    },
    size: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    /** Path relative to storage root: org_{id}/{filename} */
    storage_key: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
  },
  {
    tableName: "media",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    charset: "utf8mb4",
    indexes: [{ fields: ["organisation_id"] }, { fields: ["created_at"] }],
  },
);

module.exports = Media;
