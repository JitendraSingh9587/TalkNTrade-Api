const otpService = require("../services/otpService");
const { sendSuccess, sendError } = require("../utils/response");

/**
 * Public: request REGISTER OTP (email channel only for web signup).
 */
const requestRegisterOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || String(email).trim().length === 0) {
      return sendError(res, "Email is required", 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return sendError(res, "Invalid email format", 400);
    }

    const result = await otpService.sendOTP({
      email: String(email).trim().toLowerCase(),
      purpose: "REGISTER",
      channel: "EMAIL",
      expiresInMinutes: parseInt(req.body.expiresInMinutes, 10) || 10,
      ip_address: req.ip || req.connection?.remoteAddress || null,
      user_agent: req.headers["user-agent"] || null,
    });

    sendSuccess(res, result, "OTP sent successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * Public: verify OTP and create ADMIN user (organisation created in a later step).
 */
const verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp, name, mobile, password } = req.body;
    if (!email || !otp) {
      return sendError(res, "email and otp are required", 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return sendError(res, "Invalid email format", 400);
    }
    if (!name || !mobile || !password) {
      return sendError(
        res,
        "name, mobile, and password are required to complete registration",
        400,
      );
    }

    const result = await otpService.verifyOTP({
      email: String(email).trim().toLowerCase(),
      otp: String(otp).trim(),
      purpose: "REGISTER",
      channel: "EMAIL",
      userData: {
        name: String(name).trim(),
        mobile: String(mobile).trim(),
        password,
        role: "ADMIN",
      },
    });

    sendSuccess(res, result, "Registration successful. Sign in to continue.");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

module.exports = {
  requestRegisterOtp,
  verifyRegisterOtp,
};
