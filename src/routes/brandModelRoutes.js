const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const { authorize } = require("../middleware/authorize");
const {
  listBrandModels,
  createBrandModel,
  getBrandModelById,
  updateBrandModel,
  deleteBrandModel,
  verifyBrandModel,
} = require("../controllers/brandModelController");

/**
 * @swagger
 * tags:
 *   name: BrandModels
 *   description: Models under a brand (table brand_models; all authenticated users)
 */

/**
 * @swagger
 * /api/v1/brand-models:
 *   get:
 *     summary: List brand models
 *     tags: [BrandModels]
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
 *         name: brand_id
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *   post:
 *     summary: Create brand model
 *     tags: [BrandModels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, brand_id]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               brand_id: { type: integer }
 */

/**
 * @swagger
 * /api/v1/brand-models/{id}:
 *   get:
 *     summary: Get brand model by id
 *     tags: [BrandModels]
 *     security:
 *       - bearerAuth: []
 *   put:
 *     summary: Update brand model
 *     tags: [BrandModels]
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     summary: Delete brand model
 *     tags: [BrandModels]
 *     security:
 *       - bearerAuth: []
 */

router.get("/", asyncHandler(listBrandModels));
router.post("/", asyncHandler(createBrandModel));
router.patch(
  "/:id/verify",
  authorize("SUPER_ADMIN"),
  asyncHandler(verifyBrandModel),
);
router.get("/:id", asyncHandler(getBrandModelById));
router.put("/:id", asyncHandler(updateBrandModel));
router.delete("/:id", asyncHandler(deleteBrandModel));

module.exports = router;
