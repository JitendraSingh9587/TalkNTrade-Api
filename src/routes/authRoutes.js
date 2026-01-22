const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { login, logout } = require('../controllers/authController');

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
 *         headers:
 *           Set-Cookie:
 *             description: Authentication cookies set
 *             schema:
 *               type: string
 *               example: accessToken=...; HttpOnly; SameSite=Strict; Path=/
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
 *                           description: Access token (also sent as HttpOnly cookie)
 *                         refreshToken:
 *                           type: string
 *                           description: Refresh token (also sent as HttpOnly cookie)
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

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     description: Logs out the user by deleting the session and clearing authentication cookies
 *     responses:
 *       200:
 *         description: Logout successful
 *         headers:
 *           Set-Cookie:
 *             description: Authentication cookies cleared
 *             schema:
 *               type: string
 *               example: accessToken=; HttpOnly; SameSite=Strict; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *       500:
 *         description: Server error
 */
router.post('/logout', asyncHandler(logout));

module.exports = router;
