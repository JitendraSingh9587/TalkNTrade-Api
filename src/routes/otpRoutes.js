const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { sendOTP, verifyOTP } = require('../controllers/otpController');

/**
 * @swagger
 * tags:
 *   name: OTP
 *   description: OTP (One-Time Password) management endpoints
 */

/**
 * @swagger
 * /api/v1/otp/send:
 *   post:
 *     summary: Send OTP to user
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - channel
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: "user@example.com"
 *               purpose:
 *                 type: string
 *                 enum: [LOGIN, REGISTER, FORGOT_PASSWORD, VERIFY_MOBILE, VERIFY_EMAIL]
 *                 description: 'Purpose of OTP (optional - if not provided, auto-detects: LOGIN if user exists, REGISTER if user does not exist)'
 *                 example: "VERIFY_EMAIL"
 *               channel:
 *                 type: string
 *                 enum: [SMS, EMAIL]
 *                 description: Channel to send OTP
 *                 example: "EMAIL"
 *               expiresInMinutes:
 *                 type: integer
 *                 description: 'OTP expiration time in minutes (default: 10)'
 *                 example: 10
 *     responses:
 *       200:
 *         description: OTP sent successfully
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
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     purpose:
 *                       type: string
 *                     channel:
 *                       type: string
 *                     expires_at:
 *                       type: string
 *       400:
 *         description: Validation error or user not found
 *       500:
 *         description: Server error
 */
router.post('/send', asyncHandler(sendOTP));

/**
 * @swagger
 * /api/v1/otp/verify:
 *   post:
 *     summary: Verify OTP
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: "user@example.com"
 *               otp:
 *                 type: string
 *                 description: 'OTP code to verify (format: 3 numbers + 2 letters, e.g., 123AB)'
 *                 example: "123AB"
 *               purpose:
 *                 type: string
 *                 enum: [LOGIN, REGISTER, FORGOT_PASSWORD, VERIFY_MOBILE, VERIFY_EMAIL]
 *                 description: OTP purpose (optional, verifies any purpose if not provided)
 *                 example: "VERIFY_EMAIL"
 *               channel:
 *                 type: string
 *                 enum: [SMS, EMAIL]
 *                 description: Channel (optional, verifies any channel if not provided)
 *                 example: "EMAIL"
 *               name:
 *                 type: string
 *                 description: 'User name (required for REGISTER purpose)'
 *                 example: "John Doe"
 *               mobile:
 *                 type: string
 *                 description: 'User mobile number (required for REGISTER purpose)'
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: 'User password (required for REGISTER purpose)'
 *                 example: "SecurePassword123"
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, SUPERVISOR, USER]
 *                 description: 'User role (optional for REGISTER, defaults to USER if not provided)'
 *                 example: "USER"
 *     responses:
 *       200:
 *         description: OTP verified successfully
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
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                     purpose:
 *                       type: string
 *                     channel:
 *                       type: string
 *                     user:
 *                       type: object
 *                       description: 'User object (returned only for REGISTER purpose after user creation)'
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         mobile:
 *                           type: string
 *                         role:
 *                           type: string
 *       400:
 *         description: Invalid or expired OTP, or missing user data for REGISTER
 *       429:
 *         description: Maximum verification attempts exceeded
 *       500:
 *         description: Server error
 */
router.post('/verify', asyncHandler(verifyOTP));

module.exports = router;
