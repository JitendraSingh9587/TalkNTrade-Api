const crypto = require("crypto");
const { Op } = require("sequelize");
const { User, PasswordResetToken, UserSession } = require("../models");
const { hashPassword } = require("../shared/utils/password");
const { sendMail } = require("../shared/utils/mail");
const settingsCache = require("../shared/services/settingsCache");

const TOKEN_BYTES = 32;
const DEFAULT_EXPIRY_MINUTES = 60;

function hashResetToken(plainToken) {
  return crypto
    .createHash("sha256")
    .update(String(plainToken), "utf8")
    .digest("hex");
}

function generatePlainToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString("hex");
}

/** Base URL for reset links. Prefer `WEB_APP_URL` in app_settings; localhost is only a dev-safe default if the setting is missing or empty. */
function getWebAppBaseUrl() {
  const fallback = "http://localhost:5173";
  const raw = settingsCache.getSetting("WEB_APP_URL", fallback);
  const s = String(raw ?? "").trim();
  if (!s) return fallback;
  return s.replace(/\/$/, "");
}

function getExpiryMinutes() {
  const raw = settingsCache.getSetting(
    "PASSWORD_RESET_TOKEN_EXPIRY_MINUTES",
    String(DEFAULT_EXPIRY_MINUTES),
  );
  const n = parseInt(String(raw ?? "").trim(), 10);
  if (Number.isNaN(n) || n < 5) return DEFAULT_EXPIRY_MINUTES;
  if (n > 24 * 60) return 24 * 60;
  return n;
}

/**
 * If the email belongs to an active (non-disabled) user, create a token and send the reset link.
 * Always use a generic outcome for callers (no user enumeration).
 * @param {string} email
 * @returns {Promise<void>}
 */
const requestPasswordReset = async (email) => {
  const normalized = String(email).trim().toLowerCase();
  const user = await User.findOne({ where: { email: normalized } });

  if (!user || user.is_disabled) {
    return;
  }

  await PasswordResetToken.destroy({
    where: {
      user_id: user.id,
      used_at: null,
      expires_at: { [Op.gt]: new Date() },
    },
  });

  const plainToken = generatePlainToken();
  const tokenHash = hashResetToken(plainToken);
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + getExpiryMinutes());

  await PasswordResetToken.create({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
    used_at: null,
  });

  const base = getWebAppBaseUrl();
  const resetUrl = `${base}/reset-password?token=${encodeURIComponent(plainToken)}`;

  try {
    await sendMail({
      to: user.email,
      subject: "Reset your TalkNTrade password",
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password reset</h2>
            <p>Hello ${user.name},</p>
            <p>We received a request to reset the password for your account. Click the link below to choose a new password:</p>
            <p style="margin: 24px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 20px; background-color: #1976d2; color: #fff; text-decoration: none; border-radius: 6px;">Reset password</a>
            </p>
            <p style="word-break: break-all; color: #555; font-size: 14px;">Or copy this link into your browser:<br/>${resetUrl}</p>
            <p>This link expires in ${getExpiryMinutes()} minutes. If you did not request a reset, you can ignore this email.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated message, please do not reply.</p>
          </div>
        `,
      text: `Reset your password using this link (expires in ${getExpiryMinutes()} minutes): ${resetUrl}\n\nIf you did not request this, ignore this email.`,
    });
  } catch (err) {
    console.error("Failed to send password reset email:", err);
    await PasswordResetToken.destroy({ where: { token_hash: tokenHash } });
    throw err;
  }
};

/**
 * @param {string} plainToken
 * @param {string} newPassword
 */
const resetPasswordWithToken = async (plainToken, newPassword) => {
  const tokenHash = hashResetToken(String(plainToken).trim());
  const now = new Date();

  const record = await PasswordResetToken.findOne({
    where: {
      token_hash: tokenHash,
      used_at: null,
      expires_at: { [Op.gt]: now },
    },
  });

  if (!record) {
    const error = new Error(
      "This reset link is invalid or has expired. Request a new one from the sign-in page.",
    );
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByPk(record.user_id);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  if (user.is_disabled) {
    const error = new Error("This account is disabled. Contact support.");
    error.statusCode = 403;
    throw error;
  }

  const hashed = await hashPassword(newPassword);
  await user.update({ password: hashed });
  await record.update({ used_at: now });
  await PasswordResetToken.destroy({
    where: { user_id: user.id, used_at: null },
  });
  await UserSession.destroy({ where: { user_id: user.id } });
};

module.exports = {
  requestPasswordReset,
  resetPasswordWithToken,
};
