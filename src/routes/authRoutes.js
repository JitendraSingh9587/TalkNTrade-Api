const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { login } = require('../controllers/authController');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email or mobile number
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *               device_id:
 *                 type: string
 *                 description: Optional device identifier
 *               device_type:
 *                 type: string
 *                 enum: [WEB, MOBILE, TABLET]
 *                 description: Optional device type
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     user:
 *                       type: object
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *                         accessTokenExpiresAt:
 *                           type: string
 *                         refreshTokenExpiresAt:
 *                           type: string
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: User account is disabled
 */
router.post('/login', asyncHandler(login));

module.exports = router;
