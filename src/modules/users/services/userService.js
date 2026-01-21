const { User } = require('../models');
const { Op } = require('sequelize');
const { hashPassword } = require('../../../shared/utils/password');

/**
 * User Service
 * Contains all business logic for user operations
 */

/**
 * Get all users with optional filters
 * @param {Object} filters - Filter options (role, is_disabled, search)
 * @param {Object} pagination - Pagination options (page, limit)
 * @returns {Promise<Object>} Users and pagination info
 */
const getAllUsers = async (filters = {}, pagination = {}) => {
  const { role, is_disabled, search } = filters;
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 10;
  const offset = (page - 1) * limit;

  const where = {};

  if (role) {
    where.role = role;
  }

  if (is_disabled !== undefined) {
    where.is_disabled = is_disabled === 'true' || is_disabled === true;
  }

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { mobile: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']],
    attributes: { exclude: ['password'] }, // Exclude password from results
  });

  return {
    users: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};

/**
 * Get user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object>} User object
 */
const getUserById = async (id) => {
  const user = await User.findByPk(id, {
    attributes: { exclude: ['password'] },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
const createUser = async (userData) => {
  // Check if email already exists
  const existingUserByEmail = await User.findOne({
    where: { email: userData.email },
  });

  if (existingUserByEmail) {
    const error = new Error('Email already exists');
    error.statusCode = 409;
    throw error;
  }

  // Check if mobile already exists
  const existingUserByMobile = await User.findOne({
    where: { mobile: userData.mobile },
  });

  if (existingUserByMobile) {
    const error = new Error('Mobile number already exists');
    error.statusCode = 409;
    throw error;
  }

  // Hash password before saving
  if (userData.password) {
    userData.password = await hashPassword(userData.password);
  }

  const user = await User.create(userData);
  
  // Return user without password
  const userJson = user.toJSON();
  delete userJson.password;
  
  return userJson;
};

/**
 * Update user by ID
 * @param {number} id - User ID
 * @param {Object} updateData - Data to update
 * @param {number} currentUserId - ID of user making the request (optional)
 * @returns {Promise<Object>} Updated user
 */
const updateUser = async (id, updateData, currentUserId = null) => {
  const user = await User.findByPk(id);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Prevent SUPER_ADMIN from changing their own role
  if (
    user.role === 'SUPER_ADMIN' &&
    currentUserId &&
    parseInt(id) === parseInt(currentUserId) &&
    updateData.role &&
    updateData.role !== user.role
  ) {
    const error = new Error('Super admin cannot change their own role');
    error.statusCode = 403;
    throw error;
  }

  // Check if email is being updated and already exists
  if (updateData.email && updateData.email !== user.email) {
    const existingUser = await User.findOne({
      where: { email: updateData.email },
    });

    if (existingUser) {
      const error = new Error('Email already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  // Check if mobile is being updated and already exists
  if (updateData.mobile && updateData.mobile !== user.mobile) {
    const existingUser = await User.findOne({
      where: { mobile: updateData.mobile },
    });

    if (existingUser) {
      const error = new Error('Mobile number already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  // Hash password if it's being updated
  if (updateData.password) {
    updateData.password = await hashPassword(updateData.password);
  }

  await user.update(updateData);
  
  // Return user without password
  const userJson = user.toJSON();
  delete userJson.password;
  
  return userJson;
};

/**
 * Disable user (soft delete)
 * @param {number} id - User ID
 * @param {number} disabledBy - ID of user performing the disable action
 * @returns {Promise<Object>} Disabled user
 */
const disableUser = async (id, disabledBy = null) => {
  const user = await User.findByPk(id);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.is_disabled) {
    const error = new Error('User is already disabled');
    error.statusCode = 400;
    throw error;
  }

  await user.update({
    is_disabled: true,
    disabled_at: new Date(),
    disabled_by: disabledBy,
  });

  // Return user without password
  const userJson = user.toJSON();
  delete userJson.password;
  
  return userJson;
};

/**
 * Enable user (re-enable disabled user)
 * @param {number} id - User ID
 * @returns {Promise<Object>} Enabled user
 */
const enableUser = async (id) => {
  const user = await User.findByPk(id);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (!user.is_disabled) {
    const error = new Error('User is already enabled');
    error.statusCode = 400;
    throw error;
  }

  await user.update({
    is_disabled: false,
    disabled_at: null,
    disabled_by: null,
  });

  // Return user without password
  const userJson = user.toJSON();
  delete userJson.password;
  
  return userJson;
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  disableUser,
  enableUser,
};
