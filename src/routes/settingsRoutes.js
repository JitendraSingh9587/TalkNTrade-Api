const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const {
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
} = require('../controllers/settingsController');

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Application settings management endpoints
 */

/**
 * @swagger
 * /api/v1/settings:
 *   get:
 *     summary: Get all settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
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
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by key or description
 *     responses:
 *       200:
 *         description: List of settings
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Only SUPER_ADMIN can access
 */
router.get('/', asyncHandler(getAllSettings));

/**
 * @swagger
 * /api/v1/settings/cache:
 *   get:
 *     summary: Get cached settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     description: Returns all settings currently loaded in memory cache
 *     responses:
 *       200:
 *         description: Cached settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     settings:
 *                       type: object
 *                     count:
 *                       type: integer
 *                     isLoaded:
 *                       type: boolean
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Only SUPER_ADMIN can access
 */
router.get('/cache', asyncHandler(getCachedSettings));

/**
 * @swagger
 * /api/v1/settings/cache/refresh:
 *   post:
 *     summary: Refresh settings cache (hot reload)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     description: Reloads all active settings from database into memory cache. Use this after updating settings to apply changes without restarting the server.
 *     responses:
 *       200:
 *         description: Settings cache refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     settings:
 *                       type: object
 *                     count:
 *                       type: integer
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Only SUPER_ADMIN can access
 */
router.post('/cache/refresh', asyncHandler(refreshCache));

/**
 * @swagger
 * /api/v1/settings/smtp/verify:
 *   post:
 *     summary: Verify SMTP connection
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     description: Tests the SMTP connection with current settings from database
 *     responses:
 *       200:
 *         description: SMTP connection verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                     config:
 *                       type: object
 *                       properties:
 *                         host:
 *                           type: string
 *                         port:
 *                           type: integer
 *                         secure:
 *                           type: boolean
 *                         user:
 *                           type: string
 *                         from:
 *                           type: string
 *                         fromName:
 *                           type: string
 *       400:
 *         description: SMTP connection failed
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Only SUPER_ADMIN can access
 *       500:
 *         description: Server error
 */
router.post('/smtp/verify', asyncHandler(verifySMTP));

/**
 * @swagger
 * /api/v1/settings/key/{key}:
 *   get:
 *     summary: Get setting by key
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Setting details
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Only SUPER_ADMIN can access
 *       404:
 *         description: Setting not found
 */
router.get('/key/:key', asyncHandler(getSettingByKey));

/**
 * @swagger
 * /api/v1/settings/{id}:
 *   get:
 *     summary: Get setting by ID
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Setting details
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Only SUPER_ADMIN can access
 *       404:
 *         description: Setting not found
 */
router.get('/:id', asyncHandler(getSettingById));

/**
 * @swagger
 * /api/v1/settings:
 *   post:
 *     summary: Create a new setting
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *                 maxLength: 100
 *               value:
 *                 type: string
 *               description:
 *                 type: string
 *                 maxLength: 255
 *               is_active:
 *                 type: boolean
 *                 default: true
 *                 description: Optional, defaults to true if not provided
 *     responses:
 *       201:
 *         description: Setting created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Only SUPER_ADMIN can access
 *       409:
 *         description: Setting key already exists
 */
router.post('/', asyncHandler(createSetting));

/**
 * @swagger
 * /api/v1/settings/key/{key}:
 *   put:
 *     summary: Update setting by key
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *               description:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Setting updated successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Only SUPER_ADMIN can access
 *       404:
 *         description: Setting not found
 */
router.put('/key/:key', asyncHandler(updateSettingByKey));

/**
 * @swagger
 * /api/v1/settings/{id}:
 *   put:
 *     summary: Update setting by ID
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
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
 *               key:
 *                 type: string
 *               value:
 *                 type: string
 *               description:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Setting updated successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Only SUPER_ADMIN can access
 *       404:
 *         description: Setting not found
 */
router.put('/:id', asyncHandler(updateSetting));

/**
 * @swagger
 * /api/v1/settings/key/{key}:
 *   delete:
 *     summary: Delete setting by key
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Setting deleted successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Only SUPER_ADMIN can access
 *       404:
 *         description: Setting not found
 */
router.delete('/key/:key', asyncHandler(deleteSettingByKey));

/**
 * @swagger
 * /api/v1/settings/{id}:
 *   delete:
 *     summary: Delete setting by ID
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Setting deleted successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Only SUPER_ADMIN can access
 *       404:
 *         description: Setting not found
 */
router.delete('/:id', asyncHandler(deleteSetting));

module.exports = router;
