const express = require('express');
const router = express.Router();
const asyncHandler = require('../../../utils/asyncHandler');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  disableUser,
  enableUser,
} = require('../controllers/userController');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, SUPERVISOR, USER]
 *         description: Filter by role
 *       - in: query
 *         name: is_disabled
 *         schema:
 *           type: boolean
 *         description: Filter by disabled status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or mobile
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', asyncHandler(getAllUsers));

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:id', asyncHandler(getUserById));

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - mobile
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               mobile:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, SUPERVISOR, USER]
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email or mobile already exists
 */
router.post('/', asyncHandler(createUser));

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               mobile:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, SUPERVISOR, USER]
 *               current_user_id:
 *                 type: integer
 *                 description: ID of user making the request (for validation)
 *     responses:
 *       200:
 *         description: User updated successfully
 *       403:
 *         description: Super admin cannot change their own role
 *       404:
 *         description: User not found
 */
router.put('/:id', asyncHandler(updateUser));

/**
 * @swagger
 * /api/v1/users/{id}/disable:
 *   post:
 *     summary: Disable user (soft delete)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User disabled successfully
 *       400:
 *         description: User already disabled
 *       404:
 *         description: User not found
 */
router.post('/:id/disable', asyncHandler(disableUser));

/**
 * @swagger
 * /api/v1/users/{id}/enable:
 *   post:
 *     summary: Enable user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User enabled successfully
 *       400:
 *         description: User already enabled
 *       404:
 *         description: User not found
 */
router.post('/:id/enable', asyncHandler(enableUser));

module.exports = router;
