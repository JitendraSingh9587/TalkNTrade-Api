const { User } = require('../models');
const { hashPassword } = require('../shared/utils/password');

/**
 * User Seeder
 * Seeds initial super admin user
 */

const adminUserData = {
  name: 'Super Admin',
  email: 'admin@talkntrade.com',
  mobile: '9999999999', // Default admin mobile number
  password: 'admin@talkntrade.com',
  role: 'SUPER_ADMIN',
  is_email_verified: true,
  is_mobile_verified: true,
};

/**
 * Seed admin user into database
 * @returns {Promise<void>}
 */
const seedAdminUser = async () => {
  try {
    console.log('🌱 Seeding admin user...');

    // Check if admin user already exists
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email: adminUserData.email },
          { mobile: adminUserData.mobile },
        ],
      },
    });

    if (existingUser) {
      console.log(`  ⏭️  Admin user already exists: ${adminUserData.email}`);
      return;
    }

    // Hash password before creating user
    const hashedPassword = await hashPassword(adminUserData.password);

    // Create admin user
    const adminUser = await User.create({
      ...adminUserData,
      password: hashedPassword,
    });

    console.log(`  ✅ Created admin user: ${adminUserData.email}`);
    console.log('✅ User seeding completed');
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    throw error;
  }
};

module.exports = {
  seedAdminUser,
};
