const { AppSetting } = require('../models');
const { Op } = require('sequelize');
const settingsCache = require('../shared/services/settingsCache');

/**
 * Settings Service
 * Contains all business logic for app settings operations
 */

/**
 * Get all settings with optional filters
 * @param {Object} filters - Filter options (is_active, search)
 * @param {Object} pagination - Pagination options (page, limit)
 * @returns {Promise<Object>} Settings and pagination info
 */
const getAllSettings = async (filters = {}, pagination = {}) => {
  const { is_active, search } = filters;
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 10;
  const offset = (page - 1) * limit;

  const where = {};

  if (is_active !== undefined) {
    where.is_active = is_active === 'true' || is_active === true;
  }

  if (search) {
    where[Op.or] = [
      { key: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await AppSetting.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']],
  });

  return {
    settings: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};

/**
 * Get setting by ID
 * @param {number} id - Setting ID
 * @returns {Promise<Object>} Setting object
 */
const getSettingById = async (id) => {
  const setting = await AppSetting.findByPk(id);

  if (!setting) {
    const error = new Error('Setting not found');
    error.statusCode = 404;
    throw error;
  }

  return setting;
};

/**
 * Get setting by key
 * @param {string} key - Setting key
 * @returns {Promise<Object>} Setting object
 */
const getSettingByKey = async (key) => {
  const setting = await AppSetting.findOne({
    where: { key },
  });

  if (!setting) {
    const error = new Error('Setting not found');
    error.statusCode = 404;
    throw error;
  }

  return setting;
};

/**
 * Create a new setting
 * @param {Object} settingData - Setting data
 * @returns {Promise<Object>} Created setting
 */
const createSetting = async (settingData) => {
  // Check if key already exists
  const existingSetting = await AppSetting.findOne({
    where: { key: settingData.key },
  });

  if (existingSetting) {
    const error = new Error('Setting key already exists');
    error.statusCode = 409;
    throw error;
  }

  const setting = await AppSetting.create(settingData);
  
  // Refresh cache if setting is active
  if (setting.is_active) {
    await settingsCache.refreshCache();
  }
  
  return setting;
};

/**
 * Update setting by ID
 * @param {number} id - Setting ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated setting
 */
const updateSetting = async (id, updateData) => {
  const setting = await AppSetting.findByPk(id);

  if (!setting) {
    const error = new Error('Setting not found');
    error.statusCode = 404;
    throw error;
  }

  // Check if key is being updated and already exists
  if (updateData.key && updateData.key !== setting.key) {
    const existingSetting = await AppSetting.findOne({
      where: { key: updateData.key },
    });

    if (existingSetting) {
      const error = new Error('Setting key already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  await setting.update(updateData);
  
  // Refresh cache after update
  await settingsCache.refreshCache();
  
  return setting;
};

/**
 * Update setting by key
 * @param {string} key - Setting key
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated setting
 */
const updateSettingByKey = async (key, updateData) => {
  const setting = await AppSetting.findOne({
    where: { key },
  });

  if (!setting) {
    const error = new Error('Setting not found');
    error.statusCode = 404;
    throw error;
  }

  await setting.update(updateData);
  
  // Refresh cache after update
  await settingsCache.refreshCache();
  
  return setting;
};

/**
 * Delete setting by ID
 * @param {number} id - Setting ID
 * @returns {Promise<void>}
 */
const deleteSetting = async (id) => {
  const setting = await AppSetting.findByPk(id);

  if (!setting) {
    const error = new Error('Setting not found');
    error.statusCode = 404;
    throw error;
  }

  await setting.destroy();
  
  // Refresh cache after delete
  await settingsCache.refreshCache();
};

/**
 * Delete setting by key
 * @param {string} key - Setting key
 * @returns {Promise<void>}
 */
const deleteSettingByKey = async (key) => {
  const setting = await AppSetting.findOne({
    where: { key },
  });

  if (!setting) {
    const error = new Error('Setting not found');
    error.statusCode = 404;
    throw error;
  }

  await setting.destroy();
  
  // Refresh cache after delete
  await settingsCache.refreshCache();
};

module.exports = {
  getAllSettings,
  getSettingById,
  getSettingByKey,
  createSetting,
  updateSetting,
  updateSettingByKey,
  deleteSetting,
  deleteSettingByKey,
};
