/**
 * Models directory - Legacy location
 * 
 * Note: According to Modular Monolith Architecture,
 * models should be in src/modules/{moduleName}/models/
 * 
 * This file is kept for backward compatibility.
 * New models should be created in module-specific directories.
 */

const { sequelize } = require('../config/database');

module.exports = {
  sequelize,
};
