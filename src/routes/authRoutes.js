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
router.post("/complete-organisation", asyncHandler(completeOrganisation));

module.exports = router;
