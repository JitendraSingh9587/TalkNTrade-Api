const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const { authorize } = require("../middleware/authorize");
const {
  listProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const READ_ROLES = ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "USER"];
const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Organisation-scoped inventory (read all org roles; create/update/delete admins only)
 */

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: List products (scoped by organisation)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organisation_id
 *         schema: { type: integer }
 *         description: Super admin only — filter by organisation
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: is_sold
 *         schema: { type: string }
 *       - in: query
 *         name: brand_id
 *         schema: { type: integer }
 *       - in: query
 *         name: model_id
 *         schema: { type: integer }
 *   post:
 *     summary: Create product (super admin or org admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     summary: Get product by id
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *   put:
 *     summary: Update product (super admin or org admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     summary: Delete product (super admin or org admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */

router.get("/", authorize(...READ_ROLES), asyncHandler(listProducts));
router.get("/:id", authorize(...READ_ROLES), asyncHandler(getProductById));
router.post("/", authorize(...ADMIN_ROLES), asyncHandler(createProduct));
router.put("/:id", authorize(...ADMIN_ROLES), asyncHandler(updateProduct));
router.delete("/:id", authorize(...ADMIN_ROLES), asyncHandler(deleteProduct));

module.exports = router;
