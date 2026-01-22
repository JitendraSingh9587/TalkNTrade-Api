const { AppSetting } = require('../models');

/**
 * Settings Seeder
 * Seeds initial application settings including JWT secrets
 */

const settingsData = [
  {
    key: 'JWT_SECRET',
    value:  'your-super-secret-jwt-key-change-in-production',
    description: 'JWT access token secret key',
    is_active: true,
  },
  {
    key: 'JWT_REFRESH_SECRET',
    value: 'your-super-secret-refresh-key-change-in-production',
    description: 'JWT refresh token secret key',
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
