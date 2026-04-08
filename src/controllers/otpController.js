const otpService = require("../services/otpService");
const { sendSuccess, sendError } = require("../utils/response");

/**
 * OTP Controller
 * Handles HTTP requests and responses for OTP operations
 */

/**
 * Send OTP to user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendOTP = async (req, res) => {
  try {
    const { email, purpose, channel, expiresInMinutes } = req.body;

    // Validate required fields
    if (!email || !channel) {
      return sendError(res, "email and channel are required", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, "Invalid email format", 400);
    }

    // Validate purpose if provided
    if (purpose) {
      const validPurposes = [
        "LOGIN",
        "REGISTER",
        "FORGOT_PASSWORD",
        "VERIFY_MOBILE",
        "VERIFY_EMAIL",
      ];
      if (!validPurposes.includes(purpose)) {
        return sendError(
          res,
          `Invalid purpose. Must be one of: ${validPurposes.join(", ")}`,
          400,
        );
      }
    }

    // Validate channel
    const validChannels = ["SMS", "EMAIL"];
    if (!validChannels.includes(channel)) {
      return sendError(res, "Invalid channel. Must be SMS or EMAIL", 400);
    }

    const result = await otpService.sendOTP({
      email,
      purpose: purpose || null, // Pass null if not provided, service will auto-detect
      channel,
      expiresInMinutes: expiresInMinutes || 10,
      ip_address: req.ip || req.connection.remoteAddress || null,
      user_agent: req.headers["user-agent"] || null,
    });

    sendSuccess(res, result, "OTP sent successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

/**
 * Verify OTP
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyOTP = async (req, res) => {
  try {
    const {
      email,
      otp,
      purpose,
      channel,
      name,
      mobile,
      password,
      role,
      organisation_id,
      organisation,
    } = req.body;

    // Validate required fields
    if (!email || !otp) {
      return sendError(res, "email and otp are required", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, "Invalid email format", 400);
    }

    // For REGISTER purpose, user data is required
    let userData = null;
    if (purpose === "REGISTER" || (!purpose && !req.user)) {
      // Check if user exists to determine if it's REGISTER
      const { User } = require("../models");
      const existingUser = await User.findOne({ where: { email } });

      if (!existingUser) {
        // It's REGISTER, validate user data
        if (!name || !mobile || !password) {
          return sendError(
            res,
            "For registration, name, mobile, and password are required",
            400,
          );
        }
        userData = {
          name,
          mobile,
          password,
          role: role || "USER",
          organisation_id,
          organisation,
        };
      }
    }

    const result = await otpService.verifyOTP({
      email,
      otp,
      purpose: purpose || null,
      channel: channel || null,
      userData,
    });

    sendSuccess(res, result, "OTP verified successfully");
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
};
