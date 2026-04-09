const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const {
  verifyToken,
  completeOrganisation,
} = require("../controllers/authController");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /api/v1/auth/verify:
 *   get:
 *     summary: Verify access token and return current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Missing, invalid, or expired token
 */
router.get("/verify", asyncHandler(verifyToken));

/**
 * @swagger
 * /api/v1/auth/complete-organisation:
 *   post:
 *     summary: Create organisation and link ADMIN account (pending org setup only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Organisation payload (name, type, etc.)
 *     responses:
 *       200:
 *         description: Organisation created and linked
 *       400:
 *         description: Validation error or not eligible
 *       401:
 *         description: Unauthorized
 */
router.post("/complete-organisation", asyncHandler(completeOrganisation));

module.exports = router;
