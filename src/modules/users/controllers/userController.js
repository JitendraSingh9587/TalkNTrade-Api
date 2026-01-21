const userService = require('../services/userService');
const { validateCreateUser, validateUpdateUser } = require('../validators/userValidator');
const { sendSuccess, sendError } = require('../../../utils/response');

/**
 * User Controller
 * Handles HTTP requests and responses for user operations
 */

/**
 * Get all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllUsers = async (req, res) => {
  try {
    const filters = {
      role: req.query.role,
      is_disabled: req.query.is_disabled,
      search: req.query.search,
    };

    const pagination = {
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = await userService.getAllUsers(filters, pagination);
    sendSuccess(res, result, 'Users retrieved successfully');
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * Get user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    sendSuccess(res, user, 'User retrieved successfully');
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * Create new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createUser = async (req, res) => {
  try {
    // Validate request data
    const validation = validateCreateUser(req.body);
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(', '), 400);
    }

    const user = await userService.createUser(req.body);
    sendSuccess(res, user, 'User created successfully', 201);
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * Update user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateUser = async (req, res) => {
  try {
    // Validate request data
    const validation = validateUpdateUser(req.body);
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(', '), 400);
    }

    const { id } = req.params;
    // Get current user ID from authenticated user (req.user.id) or from request body
    // In production, this should come from authentication middleware
    const currentUserId = req.body.current_user_id || req.user?.id || null;
    
    const user = await userService.updateUser(id, req.body, currentUserId);
    sendSuccess(res, user, 'User updated successfully');
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * Disable user (soft delete)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const disableUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Get disabled_by from authenticated user (req.user.id) or from request body
    const disabledBy = req.body.disabled_by || req.user?.id || null;
    const user = await userService.disableUser(id, disabledBy);
    sendSuccess(res, user, 'User disabled successfully');
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * Enable user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const enableUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.enableUser(id);
    sendSuccess(res, user, 'User enabled successfully');
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  disableUser,
  enableUser,
};
