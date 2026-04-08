const { Otp, User, Organisation, sequelize } = require("../models");
const {
  validateOrganisationPayload,
} = require("../validators/organisationValidator");
const { Op } = require("sequelize");
const crypto = require("crypto");
const { sendMail } = require("../shared/utils/mail");

/**
 * OTP Service
 * Handles OTP generation, sending, and verification
 */

/**
 * Generate OTP (3 numbers + 2 alphabets)
 * Format: 123AB (3 digits + 2 uppercase letters)
 * @returns {string} Generated OTP
 */
const generateOTP = () => {
  // Generate 3 random numbers
  const numbers = Math.floor(100 + Math.random() * 900).toString(); // 100-999

  // Generate 2 random uppercase letters
  const letters = String.fromCharCode(
    65 + Math.floor(Math.random() * 26), // A-Z
    65 + Math.floor(Math.random() * 26), // A-Z
  );

  return numbers + letters; // e.g., "123AB"
};

/**
 * Send OTP to user
 * @param {Object} otpData - OTP data
 * @param {string} otpData.email - User email address
 * @param {string} otpData.purpose - OTP purpose (LOGIN, REGISTER, FORGOT_PASSWORD, VERIFY_MOBILE, VERIFY_EMAIL). If not provided, auto-detects based on user existence
 * @param {string} otpData.channel - Channel (SMS or EMAIL)
 * @param {number} otpData.expiresInMinutes - Expiration time in minutes (default: 10)
 * @param {string} otpData.ip_address - IP address (optional)
 * @param {string} otpData.user_agent - User agent (optional)
 * @returns {Promise<Object>} Created OTP object
 */
const sendOTP = async (otpData) => {
  const {
    email,
    purpose,
    channel,
    expiresInMinutes = 10,
    ip_address = null,
    user_agent = null,
  } = otpData;

  // Find user by email
  const user = await User.findOne({
    where: { email },
  });

  // Auto-detect purpose if not provided
  let finalPurpose = purpose;
  if (!finalPurpose) {
    if (user) {
      finalPurpose = "LOGIN"; // User exists, set purpose as LOGIN
    } else {
      finalPurpose = "REGISTER"; // User doesn't exist, set purpose as REGISTER
    }
  }

  // Validate purpose and user existence
  if (finalPurpose === "REGISTER" && user) {
    // User already exists, can't register again
    const error = new Error(
      "User already exists with this email. Use LOGIN purpose instead.",
    );
    error.statusCode = 400;
    throw error;
  }

  if (finalPurpose === "LOGIN" && !user) {
    // User doesn't exist, can't login
    const error = new Error(
      "User not found with this email. Use REGISTER purpose instead.",
    );
    error.statusCode = 404;
    throw error;
  }

  // For REGISTER, user_id will be null (user doesn't exist yet)
  // For LOGIN and other purposes, user_id will be set
  const user_id = user ? user.id : null;

  // Generate OTP
  const otp = generateOTP();

  // Calculate expiration time
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

  // Delete previous unused OTPs of same purpose and channel
  // For REGISTER, use email; for others, use user_id
  const whereClause = {
    purpose: finalPurpose,
    channel,
    is_used: false,
    expires_at: {
      [Op.gt]: new Date(), // Only delete non-expired OTPs
    },
  };

  if (finalPurpose === "REGISTER") {
    whereClause.email = email;
    whereClause.user_id = null;
  } else {
    whereClause.user_id = user_id;
  }

  // Delete old unverified OTPs
  await Otp.destroy({
    where: whereClause,
  });

  // Create new OTP
  const otpRecord = await Otp.create({
    user_id: user_id, // null for REGISTER
    email: finalPurpose === "REGISTER" ? email : null, // Store email for REGISTER
    otp,
    purpose: finalPurpose,
    channel,
    expires_at: expiresAt,
    ip_address,
    user_agent,
    is_used: false,
    attempts: 0,
  });

  // Send OTP via email or SMS
  if (channel === "EMAIL") {
    try {
      const purposeMessages = {
        LOGIN: "Login",
        REGISTER: "Registration",
        FORGOT_PASSWORD: "Password Reset",
        VERIFY_EMAIL: "Email Verification",
        VERIFY_MOBILE: "Mobile Verification",
      };

      const purposeMessage = purposeMessages[finalPurpose] || "Verification";

      // Use email directly (for REGISTER, user doesn't exist yet)
      const recipientEmail = user ? user.email : email;
      const recipientName = user ? user.name : email.split("@")[0];

      await sendMail({
        to: recipientEmail,
        subject: `${purposeMessage} OTP - TalkNTrade`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${purposeMessage} OTP</h2>
            <p>Hello ${recipientName},</p>
            <p>Your OTP for ${purposeMessage.toLowerCase()} is:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            <p>This OTP will expire in ${expiresInMinutes} minutes.</p>
            <p>If you did not request this OTP, please ignore this email.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated message, please do not reply.</p>
          </div>
        `,
        text: `Your OTP for ${purposeMessage.toLowerCase()} is: ${otp}. This OTP will expire in ${expiresInMinutes} minutes.`,
      });
    } catch (error) {
      console.error("Failed to send OTP email:", error);
      // Don't throw error, OTP is still created in database
    }
  } else if (channel === "SMS") {
    // TODO: Implement SMS sending logic here
    // For now, just log (you can integrate with SMS service later)
    console.log(`SMS OTP for user ${user_id}: ${otp}`);
  }

  // Return OTP without sensitive data (don't return actual OTP in production)
  const otpResponse = otpRecord.toJSON();
  // In production, you might want to hide the OTP or return masked version
  // For now, returning it as user needs to verify
  return {
    id: otpResponse.id,
    email: email,
    purpose: otpResponse.purpose,
    channel: otpResponse.channel,
    expires_at: otpResponse.expires_at,
    detected_purpose: finalPurpose, // Show what purpose was detected/used
    // OTP is sent via email/SMS, not returned in response for security
    // But including it for testing purposes - remove in production
    otp: process.env.NODE_ENV === "development" ? otpResponse.otp : "***",
  };
};

/**
 * Verify OTP
 * @param {Object} verifyData - Verification data
 * @param {string} verifyData.email - User email address
 * @param {string} verifyData.otp - OTP code to verify
 * @param {string} verifyData.purpose - OTP purpose (optional, if not provided verifies any purpose)
 * @param {string} verifyData.channel - Channel (optional, if not provided verifies any channel)
 * @param {Object} verifyData.userData - User data for REGISTER (optional, required if purpose is REGISTER)
 * @returns {Promise<Object>} Verification result
 */
const verifyOTP = async (verifyData) => {
  const {
    email,
    otp,
    purpose = null,
    channel = null,
    userData = null,
  } = verifyData;

  // Check if user exists
  let user = await User.findOne({
    where: { email },
  });

  // Auto-detect purpose if not provided
  let finalPurpose = purpose;
  if (!finalPurpose) {
    if (user) {
      finalPurpose = "LOGIN"; // User exists, it's LOGIN
    } else {
      finalPurpose = "REGISTER"; // User doesn't exist, it's REGISTER
    }
  }

  // Build where clause based on finalPurpose
  const whereClause = {
    otp: otp.toUpperCase(), // Convert to uppercase for comparison
    is_used: false,
    expires_at: {
      [Op.gt]: new Date(), // Not expired
    },
  };

  // For REGISTER, user_id will be null, use email instead
  if (finalPurpose === "REGISTER") {
    if (user) {
      const error = new Error("User already exists with this email");
      error.statusCode = 400;
      throw error;
    }
    whereClause.user_id = null;
    whereClause.email = email;
    whereClause.purpose = "REGISTER";
  } else {
    // For other purposes, user must exist
    if (!user) {
      const error = new Error("User not found with this email");
      error.statusCode = 404;
      throw error;
    }
    whereClause.user_id = user.id;
    if (finalPurpose) {
      whereClause.purpose = finalPurpose;
    }
  }

  if (channel) {
    whereClause.channel = channel;
  }

  // Find OTP
  const otpRecord = await Otp.findOne({
    where: whereClause,
    order: [["created_at", "DESC"]], // Get latest OTP
  });

  if (!otpRecord) {
    // Increment attempts for failed verification (if OTP exists but expired/used)
    const failedWhereClause = {
      otp: otp.toUpperCase(),
      ...(finalPurpose && { purpose: finalPurpose }),
      ...(channel && { channel }),
    };

    if (finalPurpose === "REGISTER") {
      failedWhereClause.email = email;
      failedWhereClause.user_id = null;
    } else if (user) {
      failedWhereClause.user_id = user.id;
    }

    const failedOtp = await Otp.findOne({
      where: failedWhereClause,
      order: [["created_at", "DESC"]],
    });

    if (failedOtp) {
      await failedOtp.increment("attempts");
    }

    const error = new Error("Invalid or expired OTP");
    error.statusCode = 400;
    throw error;
  }

  // Check max attempts
  const maxAttempts = 5;
  if (otpRecord.attempts >= maxAttempts) {
    const error = new Error(
      "Maximum verification attempts exceeded. Please request a new OTP.",
    );
    error.statusCode = 429;
    throw error;
  }

  // Increment attempts
  await otpRecord.increment("attempts");

  // If REGISTER purpose and OTP is valid, create user
  if (finalPurpose === "REGISTER" && otpRecord.purpose === "REGISTER") {
    if (!userData || !userData.name || !userData.mobile || !userData.password) {
      const error = new Error(
        "User data (name, mobile, password) is required for registration",
      );
      error.statusCode = 400;
      throw error;
    }

    const role = userData.role || "USER";

    if (role === "SUPER_ADMIN") {
      const error = new Error(
        "Super admin accounts cannot be registered through this flow",
      );
      error.statusCode = 403;
      throw error;
    }

    const { hashPassword } = require("../shared/utils/password");
    const hashedPassword = await hashPassword(userData.password);

    if (role === "ADMIN") {
      if (!userData.organisation || typeof userData.organisation !== "object") {
        const error = new Error(
          "organisation is required when registering as ADMIN (name, type, address, phone, email, website, logo_url, banner_url, description, status)",
        );
        error.statusCode = 400;
        throw error;
      }
      const orgValidation = validateOrganisationPayload(userData.organisation, {
        partial: false,
      });
      if (!orgValidation.isValid) {
        const error = new Error(orgValidation.errors.join(", "));
        error.statusCode = 400;
        throw error;
      }

      await sequelize.transaction(async (t) => {
        const org = await Organisation.create(
          {
            name: String(userData.organisation.name).trim(),
            type: userData.organisation.type || "COMPANY",
            address: userData.organisation.address ?? null,
            phone: userData.organisation.phone ?? null,
            email: userData.organisation.email ?? null,
            website: userData.organisation.website ?? null,
            logo_url: userData.organisation.logo_url ?? null,
            banner_url: userData.organisation.banner_url ?? null,
            description: userData.organisation.description ?? null,
            status: userData.organisation.status || "ACTIVE",
          },
          { transaction: t },
        );

        user = await User.create(
          {
            name: userData.name,
            email,
            mobile: userData.mobile,
            password: hashedPassword,
            role: "ADMIN",
            organisation_id: org.id,
            is_email_verified: true,
            is_mobile_verified: false,
            is_disabled: false,
          },
          { transaction: t },
        );
      });
    } else {
      const oid =
        userData.organisation_id !== undefined &&
        userData.organisation_id !== null &&
        userData.organisation_id !== ""
          ? parseInt(userData.organisation_id, 10)
          : null;

      if (!oid || Number.isNaN(oid)) {
        const error = new Error(
          "organisation_id is required for USER and SUPERVISOR registration (existing active organisation)",
        );
        error.statusCode = 400;
        throw error;
      }

      const org = await Organisation.findByPk(oid);
      if (!org || org.status !== "ACTIVE") {
        const error = new Error("Invalid or inactive organisation");
        error.statusCode = 400;
        throw error;
      }

      user = await User.create({
        name: userData.name,
        email,
        mobile: userData.mobile,
        password: hashedPassword,
        role,
        organisation_id: org.id,
        is_email_verified: true,
        is_mobile_verified: false,
        is_disabled: false,
      });
    }

    await otpRecord.update({
      user_id: user.id,
    });
  }

  // Mark OTP as used
  await otpRecord.update({
    is_used: true,
    used_at: new Date(),
  });

  // Remove password from user object if returned
  let userResponse = null;
  if (otpRecord.purpose === "REGISTER" && user) {
    const full = await User.findByPk(user.id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Organisation,
          as: "organisation",
          attributes: ["id", "name", "status", "type"],
        },
      ],
    });
    userResponse = full ? full.toJSON() : user.toJSON();
    delete userResponse.password;
  }

  return {
    success: true,
    message: "OTP verified successfully",
    purpose: otpRecord.purpose,
    channel: otpRecord.channel,
    ...(userResponse && { user: userResponse }),
  };
};

/**
 * Get active OTP for user
 * @param {string} email - User email address
 * @param {string} purpose - OTP purpose (optional)
 * @param {string} channel - Channel (optional)
 * @returns {Promise<Object|null>} Active OTP or null
 */
const getActiveOTP = async (email, purpose = null, channel = null) => {
  // Find user by email
  const user = await User.findOne({
    where: { email },
  });

  if (!user) {
    return null;
  }

  const user_id = user.id;
  const whereClause = {
    user_id,
    is_used: false,
    expires_at: {
      [Op.gt]: new Date(),
    },
  };

  if (purpose) {
    whereClause.purpose = purpose;
  }

  if (channel) {
    whereClause.channel = channel;
  }

  const otpRecord = await Otp.findOne({
    where: whereClause,
    order: [["created_at", "DESC"]],
  });

  return otpRecord ? otpRecord.toJSON() : null;
};

module.exports = {
  generateOTP,
  sendOTP,
  verifyOTP,
  getActiveOTP,
};
