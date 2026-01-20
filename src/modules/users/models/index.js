const User = require('./User');
const UserSession = require('./UserSession');
const defineRelationships = require('./relationships');

/**
 * Users module models
 * Export all models from this module
 * 
 * Initialize relationships when models are imported
 */
defineRelationships();

module.exports = {
  User,
  UserSession,
};
