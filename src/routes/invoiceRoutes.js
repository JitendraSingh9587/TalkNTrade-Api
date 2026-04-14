const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const { authorize } = require("../middleware/authorize");
const {
  listInvoices,
  createInvoice,
  createInvoiceFromProductSale,
  createInvoiceFromMultiProductSale,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
} = require("../controllers/invoiceController");

const READ_ROLES = ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "USER"];
const WRITE_ROLES = ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "USER"];
const DELETE_ROLES = ["SUPER_ADMIN", "ADMIN"];

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Organisation-scoped invoices (soft delete)
 */

router.post(
  "/from-product-sale",
  authorize(...WRITE_ROLES),
  asyncHandler(createInvoiceFromProductSale),
);
router.post(
  "/from-multi-product-sale",
  authorize(...WRITE_ROLES),
  asyncHandler(createInvoiceFromMultiProductSale),
);
router.get("/", authorize(...READ_ROLES), asyncHandler(listInvoices));
router.get("/:id", authorize(...READ_ROLES), asyncHandler(getInvoiceById));
router.post("/", authorize(...WRITE_ROLES), asyncHandler(createInvoice));
router.put("/:id", authorize(...WRITE_ROLES), asyncHandler(updateInvoice));
router.delete(
  "/:id",
  authorize(...DELETE_ROLES),
  asyncHandler(deleteInvoice),
);

module.exports = router;
