const User = require("./User");
const UserSession = require("./UserSession");
const Otp = require("./Otp");
const Organisation = require("./Organisation");

/**
 * Define model relationships
 */
const defineRelationships = () => {
  Organisation.hasMany(User, {
    foreignKey: "organisation_id",
    as: "users",
  });

  User.belongsTo(Organisation, {
    foreignKey: "organisation_id",
    as: "organisation",
  });

  // User has many UserSessions
  User.hasMany(UserSession, {
    foreignKey: "user_id",
    as: "sessions",
  });

  // UserSession belongs to User
  UserSession.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });

  // User has many OTPs
  User.hasMany(Otp, {
    foreignKey: "user_id",
    as: "otps",
  });

  // OTP belongs to User
  Otp.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });
};

module.exports = defineRelationships;
