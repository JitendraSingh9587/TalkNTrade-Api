const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const { authorize } = require("../middleware/authorize");
const {
  listCustomers,
  listAssignableUsers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");

const READ_ROLES = ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "USER"];
const WRITE_ROLES = ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "USER"];
const DELETE_ROLES = ["SUPER_ADMIN", "ADMIN"];

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Organisation-scoped customers (soft delete)
 */

router.get(
  "/assignable-users",
  authorize(...WRITE_ROLES),
  asyncHandler(listAssignableUsers),
);
router.get("/", authorize(...READ_ROLES), asyncHandler(listCustomers));
router.get("/:id", authorize(...READ_ROLES), asyncHandler(getCustomerById));
router.post("/", authorize(...WRITE_ROLES), asyncHandler(createCustomer));
router.put("/:id", authorize(...WRITE_ROLES), asyncHandler(updateCustomer));
router.delete(
  "/:id",
  authorize(...DELETE_ROLES),
  asyncHandler(deleteCustomer),
);

module.exports = router;
