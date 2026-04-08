const passwordResetService = require("../services/passwordResetService");
const {
  validateForgotPassword,
  validateResetPassword,
  FORGOT_PASSWORD_GENERIC_MESSAGE,
} = require("../validators/authValidator");
const { sendSuccess, sendError } = require("../utils/response");

const forgotPassword = async (req, res) => {
  try {
    const validation = validateForgotPassword(req.body || {});
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(", "), 400);
    }

    const email = String(req.body.email).trim().toLowerCase();
    try {
      await passwordResetService.requestPasswordReset(email);
    } catch (err) {
      console.error("Password reset request failed:", err);
      return sendError(
        res,
        "Could not send reset email. Try again later or contact support.",
        503,
      );
    }

    sendSuccess(res, null, FORGOT_PASSWORD_GENERIC_MESSAGE);
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

const resetPassword = async (req, res) => {
  try {
    const validation = validateResetPassword(req.body || {});
    if (!validation.isValid) {
      return sendError(res, validation.errors.join(", "), 400);
    }

    const { token, password } = req.body;
    await passwordResetService.resetPasswordWithToken(token, password);
    sendSuccess(
      res,
      { success: true },
      "Password updated. You can sign in with your new password.",
    );
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
};
