const { AppSetting } = require('../models');

/**
 * Settings Seeder
 * Seeds initial application settings including JWT secrets
 */

const settingsData = [
  {
    key: 'JWT_SECRET',
    value:  'e506a374-2ad5-4ba9-855a-49544fe547dc',
    description: 'JWT access token secret key',
    is_active: true,
  },
  {
    key: 'JWT_REFRESH_SECRET',
    value: 'a757479b-f3fa-4499-b087-33a06b06154a',
    description: 'JWT refresh token secret key',
    is_active: true,
  },
  {
    key: 'MAX_LOGIN_SESSIONS',
    value: '2',
    description: 'Maximum number of concurrent login sessions allowed per user',
    is_active: true,
  },
  {
    key: 'ACCESS_TOKEN_EXPIRY',
    value: '7d',
    description: 'Access token expiration time (e.g., 7d, 1h, 30m). Format: number followed by unit (d=days, h=hours, m=minutes, s=seconds)',
    is_active: true,
  },
  {
    key: 'REFRESH_TOKEN_EXPIRY',
    value: '7d',
    description: 'Refresh token expiration time (e.g., 7d, 1h, 30m). Format: number followed by unit (d=days, h=hours, m=minutes, s=seconds)',
    is_active: true,
  },
  {
    key: 'SMTP_HOST',
    value: 'smtp.gmail.com',
    description: 'SMTP server hostname',
    is_active: true,
  },
  {
    key: 'SMTP_PORT',
    value: '587',
    description: 'SMTP server port (587 for TLS, 465 for SSL, 25 for unencrypted)',
    is_active: true,
  },
  {
    key: 'SMTP_SECURE',
    value: 'false',
    description: 'Use SSL/TLS for SMTP connection (true for port 465, false for other ports)',
    is_active: true,
  },
  {
    key: 'SMTP_USER',
    value: process.env.SMTP_USER,
    description: 'SMTP authentication username (email address)',
    is_active: true,
  },
  {
    key: 'SMTP_PASSWORD',
    value: process.env.SMTP_PASSWORD,
    description: 'SMTP authentication password or app password',
    is_active: true,
  },
  {
    key: 'SMTP_FROM',
    value: 'jsboyana166@gmail.com',
    description: 'Default sender email address',
    is_active: true,
  },
  {
    key: 'SMTP_FROM_NAME',
    value: 'TalkNTrade',
    description: 'Default sender name',
    is_active: true,
  },
  {
    key: 'SMTP_REJECT_UNAUTHORIZED',
    value: 'false',
    description: 'Reject unauthorized SSL certificates (set to true in production)',
    is_active: true,
  },
  {
    key: 'WEB_APP_URL',
    value: 'http://localhost:5173',
    description:
      'Public web app origin for password-reset links (no trailing slash), e.g. https://app.example.com',
    is_active: true,
  },
  {
    key: 'PASSWORD_RESET_TOKEN_EXPIRY_MINUTES',
    value: '60',
    description:
      'Password reset link lifetime in minutes (min 5, max 1440)',
    is_active: true,
  },
];

/**
 * Seed settings into database
 * @returns {Promise<void>}
 */
const seedSettings = async () => {
  try {
    console.log('🌱 Seeding settings...');

    for (const setting of settingsData) {
      const [settingRecord, created] = await AppSetting.findOrCreate({
        where: { key: setting.key },
        defaults: {
          value: setting.value,
          description: setting.description,
          is_active: setting.is_active,
        },
      });

      if (!created) {
        // Update existing setting if value changed in env
        if (settingRecord.value !== setting.value && process.env[setting.key]) {
          await settingRecord.update({
            value: setting.value,
            description: setting.description,
          });
          console.log(`  ✅ Updated setting: ${setting.key}`);
        } else {
          console.log(`  ⏭️  Setting already exists: ${setting.key}`);
        }
      } else {
        console.log(`  ✅ Created setting: ${setting.key}`);
      }
    }

    console.log('✅ Settings seeding completed');
  } catch (error) {
    console.error('❌ Error seeding settings:', error);
    throw error;
  }
};

module.exports = {
  seedSettings,
};
