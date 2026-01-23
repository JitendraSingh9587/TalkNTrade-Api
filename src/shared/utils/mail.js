const nodemailer = require('nodemailer');
const settingsCache = require('../services/settingsCache');

/**
 * Mail utility functions
 * Handles SMTP email sending using nodemailer
 */

let transporter = null;

/**
 * Get SMTP configuration from settings cache
 * @returns {Object} SMTP configuration object
 */
const getSMTPConfig = () => {
  return {
    host: settingsCache.getSetting('SMTP_HOST', 'smtp.gmail.com'),
    port: parseInt(settingsCache.getSetting('SMTP_PORT', '587'), 10),
    secure: settingsCache.getSetting('SMTP_SECURE', 'false') === 'true', // true for 465, false for other ports
    auth: {
      user: settingsCache.getSetting('SMTP_USER', ''),
      pass: settingsCache.getSetting('SMTP_PASSWORD', ''),
    },
    tls: {
      rejectUnauthorized: settingsCache.getSetting('SMTP_REJECT_UNAUTHORIZED', 'false') === 'true',
    },
  };
};

/**
 * Initialize or get SMTP transporter
 * @returns {Object} Nodemailer transporter instance
 */
const getTransporter = () => {
  if (!transporter) {
    const config = getSMTPConfig();
    
    if (!config.auth.user || !config.auth.pass) {
      throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD in settings.');
    }

    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      tls: config.tls,
    });
  } else {
    // Update transporter config if settings changed
    const config = getSMTPConfig();
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      tls: config.tls,
    });
  }

  return transporter;
};

/**
 * Reset transporter (useful when SMTP settings are updated)
 */
const resetTransporter = () => {
  transporter = null;
};

/**
 * Send email
 * @param {Object} mailOptions - Email options
 * @param {string} mailOptions.to - Recipient email address
 * @param {string} mailOptions.subject - Email subject
 * @param {string} mailOptions.text - Plain text email body
 * @param {string} mailOptions.html - HTML email body (optional)
 * @param {string} mailOptions.from - Sender email address (optional, uses SMTP_FROM setting)
 * @param {Array} mailOptions.cc - CC recipients (optional)
 * @param {Array} mailOptions.bcc - BCC recipients (optional)
 * @param {Array} mailOptions.attachments - Email attachments (optional)
 * @returns {Promise<Object>} Email send result
 */
const sendMail = async (mailOptions) => {
  try {
    const transporterInstance = getTransporter();

    // Get default from address from settings
    const defaultFrom = settingsCache.getSetting('SMTP_FROM', 'noreply@talkntrade.com');
    const fromName = settingsCache.getSetting('SMTP_FROM_NAME', 'TalkNTrade');

    const emailOptions = {
      from: mailOptions.from || `"${fromName}" <${defaultFrom}>`,
      to: mailOptions.to,
      subject: mailOptions.subject,
      text: mailOptions.text,
      html: mailOptions.html || mailOptions.text, // Use HTML if provided, else use text
      ...(mailOptions.cc && { cc: mailOptions.cc }),
      ...(mailOptions.bcc && { bcc: mailOptions.bcc }),
      ...(mailOptions.attachments && { attachments: mailOptions.attachments }),
    };

    const info = await transporterInstance.sendMail(emailOptions);
    
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Verify SMTP connection
 * @returns {Promise<boolean>} True if connection is successful
 */
const verifySMTPConnection = async () => {
  try {
    const transporterInstance = getTransporter();
    await transporterInstance.verify();
    return true;
  } catch (error) {
    console.error('SMTP verification failed:', error);
    return false;
  }
};

module.exports = {
  sendMail,
  verifySMTPConnection,
  resetTransporter,
  getSMTPConfig,
};
