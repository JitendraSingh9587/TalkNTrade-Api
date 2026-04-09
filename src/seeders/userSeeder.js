const { Op } = require("sequelize");
const { User, Organisation } = require("../models");
const { hashPassword } = require("../shared/utils/password");

/**
 * Single default organisation for seeded accounts (all roles are linked to it).
 */
const DEFAULT_ORGANISATION_NAME = "Default Organisation";

/**
 * Seed users — one per role. Password for each row equals that user’s email (dev only).
 * All users are assigned to {@link DEFAULT_ORGANISATION_NAME}.
 */
const SEED_USERS = [
  {
    name: "Super Admin",
    email: "admin@talkntrade.com",
    mobile: "9999999999",
    password: "admin@talkntrade.com",
    role: "SUPER_ADMIN",
    is_email_verified: true,
    is_mobile_verified: true,
  },
  {
    name: "Admin",
    email: "admin@talkntrade.com",
    mobile: "9999999998",
    password: "admin@talkntrade.com",
    role: "ADMIN",
    is_email_verified: true,
    is_mobile_verified: true,
  },
  {
    name: "Supervisor",
    email: "supervisor@talkntrade.com",
    mobile: "9999999997",
    password: "supervisor@talkntrade.com",
    role: "SUPERVISOR",
    is_email_verified: true,
    is_mobile_verified: true,
  },
  {
    name: "Sales User",
    email: "user@talkntrade.com",
    mobile: "9999999996",
    password: "user@talkntrade.com",
    role: "USER",
    is_email_verified: true,
    is_mobile_verified: true,
  },
];

/**
 * Ensure the default organisation exists (idempotent).
 * @returns {Promise<import("sequelize").Model>}
 */
async function ensureDefaultOrganisation() {
  const [org] = await Organisation.findOrCreate({
    where: { name: DEFAULT_ORGANISATION_NAME },
    defaults: {
      name: DEFAULT_ORGANISATION_NAME,
      type: "COMPANY",
      status: "ACTIVE",
      description:
        "Default organisation created by the user seeder. Linked to seeded ADMIN, SUPERVISOR, and USER (not SUPER_ADMIN).",
      phone: "9999999990",
      email: "contact@talkntrade.com",
    },
  });
  return org;
}

/**
 * Seed default organisation and demo users for every role (idempotent per email/mobile).
 * @returns {Promise<void>}
 */
const seedUsers = async () => {
  try {
    console.log("🌱 Seeding default organisation and demo users...");

    const defaultOrg = await ensureDefaultOrganisation();
    console.log(
      `  📁 Default organisation: ${defaultOrg.name} (id ${defaultOrg.id})`,
    );

    for (const row of SEED_USERS) {
      const { password, ...rest } = row;

      const existing = await User.findOne({
        where: {
          [Op.or]: [{ email: rest.email }, { mobile: rest.mobile }],
        },
      });

      if (existing) {
        console.log(`  ⏭️  Skip (exists): ${rest.email} (${rest.role})`);
        continue;
      }

      const hashedPassword = await hashPassword(password);
      const organisation_id =
        rest.role === "SUPER_ADMIN" ? null : defaultOrg.id;
      await User.create({
        ...rest,
        organisation_id,
        password: hashedPassword,
      });
      console.log(
        organisation_id == null
          ? `  ✅ Created: ${rest.email} (${rest.role}) — no organisation`
          : `  ✅ Created: ${rest.email} (${rest.role}) → org id ${defaultOrg.id}`,
      );
    }

    console.log("✅ User seeding completed");
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    throw error;
  }
};

/** @deprecated Use `seedUsers`; kept for compatibility */
const seedAdminUser = seedUsers;

module.exports = {
  seedUsers,
  seedAdminUser,
};
