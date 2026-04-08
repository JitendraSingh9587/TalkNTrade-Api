const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const healthRoutes = require("./healthRoutes");
const userRoutes = require("./userRoutes");
const settingsRoutes = require("./settingsRoutes");
const authRoutes = require("./authRoutes");
const otpRoutes = require("./otpRoutes");
const { login, logout } = require("../controllers/authController");

// --- Public (no access token required) ---
router.use("/", healthRoutes);

router.get("/", (req, res) => {
  res.json({
    message: "Welcome to TalkNTrade API",
    documentation: "/api-docs",
    version: "1.0.0",
  });
});

router.post("/v1/auth/login", asyncHandler(login));
// Logout stays public so clients can clear sessions when the token is already expired
router.post("/v1/auth/logout", asyncHandler(logout));

// --- All routes below require a valid access token (cookie or Bearer) ---
router.use(authenticate);

router.use("/v1/auth", authRoutes);
router.use("/v1/otp", otpRoutes);
router.use("/v1/users", authorize("SUPER_ADMIN", "ADMIN"), userRoutes);
router.use("/v1/settings", authorize("SUPER_ADMIN"), settingsRoutes);

module.exports = router;
