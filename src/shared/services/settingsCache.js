const { AppSetting } = require('../../models');

/**
 * Settings Cache Service
 * Loads and caches application settings from database
 * Provides hot reload capability for runtime updates
 */

// In-memory cache for settings
let settingsCache = {};
let isLoaded = false;

/**
 * Load all active settings from database into cache
 * @returns {Promise<void>}
 */
const loadSettings = async () => {
  try {
    const settings = await AppSetting.findAll({
      where: { is_active: true },
      attributes: ['key', 'value'],
    });

    // Clear existing cache
    settingsCache = {};

    // Populate cache
    settings.forEach((setting) => {
      settingsCache[setting.key] = setting.value;
    });

    isLoaded = true;
    console.log(`✅ Settings cache loaded: ${Object.keys(settingsCache).length} settings`);
  } catch (error) {
    console.error('❌ Error loading settings cache:', error);
    throw error;
  }
};

/**
 * Get setting value by key from cache
 * @param {string} key - Setting key
 * @param {string} defaultValue - Default value if key not found
 * @returns {string|null} Setting value or default
 */
const getSetting = (key, defaultValue = null) => {
  if (!isLoaded) {
    console.warn(`⚠️  Settings cache not loaded yet. Key: ${key}`);
    return defaultValue;
  }
  return settingsCache[key] !== undefined ? settingsCache[key] : defaultValue;
};

/**
 * Get all settings from cache
 * @returns {Object} All cached settings
 */
const getAllSettings = () => {
  return { ...settingsCache };
};

/**
 * Refresh settings cache from database
 * @returns {Promise<void>}
 */
const refreshCache = async () => {
  await loadSettings();
};

/**
 * Check if cache is loaded
 * @returns {boolean}
 */
const isCacheLoaded = () => {
  return isLoaded;
};

/**
 * Clear settings cache
 */
const clearCache = () => {
  settingsCache = {};
  isLoaded = false;
};

module.exports = {
  loadSettings,
  getSetting,
  getAllSettings,
  refreshCache,
  isCacheLoaded,
  clearCache,
};
