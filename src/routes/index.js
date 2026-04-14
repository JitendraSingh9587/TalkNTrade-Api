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
const organisationRoutes = require("./organisationRoutes");
const registerController = require("../controllers/registerController");
const passwordResetController = require("../controllers/passwordResetController");
const { getMyOrganisation } = require("../controllers/organisationController");
const { login, logout } = require("../controllers/authController");
const mediaController = require("../controllers/mediaController");
const mediaRoutes = require("./mediaRoutes");
const brandRoutes = require("./brandRoutes");
const brandModelRoutes = require("./brandModelRoutes");
const productRoutes = require("./productRoutes");
const customerRoutes = require("./customerRoutes");
const invoiceRoutes = require("./invoiceRoutes");

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

router.post(
  "/v1/auth/register/request-otp",
  asyncHandler(registerController.requestRegisterOtp),
);
router.post(
  "/v1/auth/register/verify",
  asyncHandler(registerController.verifyRegisterOtp),
);

router.post(
  "/v1/auth/forgot-password",
  asyncHandler(passwordResetController.forgotPassword),
);
router.post(
  "/v1/auth/reset-password",
  asyncHandler(passwordResetController.resetPassword),
);

router.get(
  "/v1/media/public/:token",
  asyncHandler(mediaController.servePublicMedia),
);
router.get(
  "/v1/media/org-setup/:kind/:filename",
  asyncHandler(mediaController.serveOrgSetupAsset),
);

// --- All routes below require a valid access token (cookie or Bearer) ---
router.use(authenticate);

router.get("/v1/organisations/me", asyncHandler(getMyOrganisation));
router.use("/v1/auth", authRoutes);
router.use("/v1/otp", otpRoutes);
router.use("/v1/users", authorize("SUPER_ADMIN", "ADMIN"), userRoutes);
router.use("/v1/settings", authorize("SUPER_ADMIN"), settingsRoutes);
router.use("/v1/organisations", authorize("SUPER_ADMIN"), organisationRoutes);
router.use(
  "/v1/media",
  authorize("SUPER_ADMIN", "ADMIN", "SUPERVISOR"),
  mediaRoutes,
);
router.use("/v1/brands", brandRoutes);
router.use("/v1/brand-models", brandModelRoutes);
router.use("/v1/products", productRoutes);
router.use("/v1/customers", customerRoutes);
router.use("/v1/invoices", invoiceRoutes);

module.exports = router;
