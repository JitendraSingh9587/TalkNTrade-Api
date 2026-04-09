const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const {
  listBrands,
  createBrand,
  getBrandById,
  updateBrand,
  deleteBrand,
} = require("../controllers/brandController");

/**
 * @swagger
 * tags:
 *   name: Brands
 *   description: Global brand catalog (all authenticated users)
 */

/**
 * @swagger
 * /api/v1/brands:
 *   get:
 *     summary: List brands
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated brands
 *   post:
 *     summary: Create brand
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               logo: { type: string, description: URL or path }
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /api/v1/brands/{id}:
 *   get:
 *     summary: Get brand by id
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *   put:
 *     summary: Update brand
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     summary: Delete brand (cascades brand models)
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 */

router.get("/", asyncHandler(listBrands));
router.post("/", asyncHandler(createBrand));
router.get("/:id", asyncHandler(getBrandById));
router.put("/:id", asyncHandler(updateBrand));
router.delete("/:id", asyncHandler(deleteBrand));

module.exports = router;
