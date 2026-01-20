const User = require('./User');
const UserSession = require('./UserSession');

/**
 * Define model relationships for Users module
 */
const defineRelationships = () => {
  // User has many UserSessions
  User.hasMany(UserSession, {
    foreignKey: 'user_id',
    as: 'sessions',
  });

  // UserSession belongs to User
  UserSession.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
  });
};

module.exports = defineRelationships;
