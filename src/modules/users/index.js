/**
 * Users Module
 * Exports all components of the users module
 */

const userRoutes = require('./routes/userRoutes');
const userService = require('./services/userService');
const { User, UserSession } = require('./models');

module.exports = {
  routes: userRoutes,
  service: userService,
  models: { User, UserSession },
};
