const settingsService = require('../services/settingsService');
const settingsCache = require('../shared/services/settingsCache');
const { validateCreateSetting, validateUpdateSetting } = require('../validators/settingsValidator');
const { sendSuccess, sendError } = require('../utils/response');
const { verifySMTPConnection, resetTransporter, getSMTPConfig } = require('../shared/utils/mail');

/**
 * Settings Controller
 * Handles HTTP requests and responses for settings operations
 */

/**
 * Get all settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllSettings = async (req, res) => {
  try {
    const filters = {
      is_active: req.query.is_active,
      search: req.query.search,
    };

    const pagination = {
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await settingsService.getAllSettings(filters, pagination);
    sendSuccess(res, result, 'Settings retrieved successfully');
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * Get setting by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSettingById = async (req, res) => {
  try {
    const { id } = req.params;
    const setting = await settingsService.getSettingById(id);
    sendSuccess(res, setting, 'Setting retrieved successfully');
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * Get setting by key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await settingsService.getSettingByKey(key);
    sendSuccess(res, setting, 'Setting retrieved successfully');
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * Create new setting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createSetting = async (req, res) => {
  try {
    // Validate request data
    const validation = validateCreateSetting(req.body);
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(', '), 400);
    }

    const setting = await settingsService.createSetting(req.body);
    sendSuccess(res, setting, 'Setting created successfully', 201);
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * Update setting by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateSetting = async (req, res) => {
  try {
    // Validate request data
    const validation = validateUpdateSetting(req.body);
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(', '), 400);
    }

    const { id } = req.params;
    const setting = await settingsService.updateSetting(id, req.body);
    sendSuccess(res, setting, 'Setting updated successfully');
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * Update setting by key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateSettingByKey = async (req, res) => {
  try {
    // Validate request data
    const validation = validateUpdateSetting(req.body);
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(', '), 400);
    }

    const { key } = req.params;
    const setting = await settingsService.updateSettingByKey(key, req.body);
    sendSuccess(res, setting, 'Setting updated successfully');
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * Delete setting by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteSetting = async (req, res) => {
  try {
    const { id } = req.params;
    await settingsService.deleteSetting(id);
    sendSuccess(res, null, 'Setting deleted successfully');
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * Delete setting by key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    await settingsService.deleteSettingByKey(key);
    sendSuccess(res, null, 'Setting deleted successfully');
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * Refresh settings cache (hot reload)
 * Reloads all settings from database into cache
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const refreshCache = async (req, res) => {
  try {
    await settingsCache.refreshCache();
    const allSettings = settingsCache.getAllSettings();
    sendSuccess(res, {
      settings: allSettings,
      count: Object.keys(allSettings).length,
    }, 'Settings cache refreshed successfully');
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * Get cached settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCachedSettings = async (req, res) => {
  try {
    const allSettings = settingsCache.getAllSettings();
    sendSuccess(res, {
      settings: allSettings,
      count: Object.keys(allSettings).length,
      isLoaded: settingsCache.isCacheLoaded(),
    }, 'Cached settings retrieved successfully');
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * Verify SMTP connection
 * Tests the SMTP connection with current settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifySMTP = async (req, res) => {
  try {
    // Reset transporter to use latest settings
    resetTransporter();
    
    // Get SMTP config (without sensitive data)
    const config = getSMTPConfig();
    const smtpConfig = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user ? `${config.auth.user.substring(0, 3)}***` : 'Not set', // Mask email
      from: settingsCache.getSetting('SMTP_FROM', ''),
      fromName: settingsCache.getSetting('SMTP_FROM_NAME', ''),
    };

    // Verify connection
    const isConnected = await verifySMTPConnection();

    if (isConnected) {
      sendSuccess(res, {
        connected: true,
        message: 'SMTP connection successful',
        config: smtpConfig,
      }, 'SMTP connection verified successfully');
    } else {
      sendError(res, {
        connected: false,
        message: 'SMTP connection failed. Please check your SMTP settings.',
        config: smtpConfig,
      }, 'SMTP connection verification failed', 400);
    }
  } catch (error) {
    sendError(res, {
      connected: false,
      message: error.message,
      error: error.message,
    }, 'SMTP connection verification failed', 500);
  }
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
  refreshCache,
  getCachedSettings,
  verifySMTP,
};
