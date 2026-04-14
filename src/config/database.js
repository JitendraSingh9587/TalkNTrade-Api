const { Sequelize } = require("sequelize");

/**
 * Sequelize database connection instance
 * Shared database connection for all modules
 */
const sequelize = new Sequelize(
  process.env.DB_NAME || "talkntrade",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: false,
    },
  },
);

/**
 * Test database connection
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL database connection established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    process.exit(1);
  }
};

/**
 * Sync database models
 * Creates tables if they don't exist, alters them if alter=true
 * @param {boolean} force - Force sync (drops all tables - USE WITH CAUTION!)
 * @param {boolean} alter - Alter tables to match models (adds missing columns)
 * @returns {Promise<void>}
 */
const syncDB = async (force = false, alter = false) => {
  try {
    if (force) {
      console.warn("⚠️  WARNING: Force sync will DROP all tables!");
    }

    await sequelize.sync({
      force,
      alter,
      // Only create tables, don't drop existing ones
      match: /.*/,
    });

    if (force) {
      console.log("✅ Database tables created (force sync).");
    } else if (alter) {
      console.log("✅ Database tables synchronized (altered to match models).");
    } else {
      console.log("✅ Database tables verified/created.");
    }
  } catch (error) {
    // Handle "Too many keys" error - common when table has too many indexes
    if (
      error.name === "SequelizeDatabaseError" &&
      error.parent &&
      error.parent.code === "ER_TOO_MANY_KEYS"
    ) {
      console.error(
        "❌ Error: Table has too many indexes (MySQL limit: 64 keys)",
      );
      console.error(
        "💡 Solution: Drop the problematic table(s) and restart server",
      );
      console.error("   Example SQL: DROP TABLE IF EXISTS users;");
      console.error("   Or set DB_SYNC_ALTER=false in .env to skip auto-alter");
      console.error("\n📝 Error details:", error.parent.sqlMessage);

      // In development, we can continue without alter
      if (process.env.NODE_ENV === "development" && alter) {
        console.warn(
          "⚠️  Continuing without table alterations in development mode...",
        );
        console.warn("⚠️  Tables exist but may not match models exactly.");
        return; // Don't throw, allow server to start
      }
    }

    console.error("❌ Error synchronizing database:", error.message);
    throw error;
  }
};

/**
 * Sequelize sync({ alter }) often skips new columns on existing MySQL tables.
 * Ensures media.public_token exists for public URLs.
 */
const ensureMediaPublicTokenColumn = async () => {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media' AND COLUMN_NAME = 'public_token'`,
  );
  const count = Number(rows[0]?.c ?? 0);
  if (count > 0) return;

  const [tables] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media'`,
  );
  if (Number(tables[0]?.c ?? 0) === 0) return;

  await sequelize.query(
    "ALTER TABLE `media` ADD COLUMN `public_token` VARCHAR(64) NULL",
  );
  try {
    await sequelize.query(
      "CREATE UNIQUE INDEX `media_public_token_unique` ON `media` (`public_token`)",
    );
  } catch (e) {
    const dup = e.parent?.code === "ER_DUP_KEYNAME" || e.parent?.errno === 1061;
    if (!dup) throw e;
  }
  console.log("✅ Schema patch: added column media.public_token");
};

/**
 * Sequelize sync alter may skip new columns on existing MySQL `products` table.
 */
const ensureProductWarrantyColumns = async () => {
  const [tables] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'`,
  );
  if (Number(tables[0]?.c ?? 0) === 0) return;

  const [cols] = await sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'
       AND COLUMN_NAME IN ('is_warranty_available', 'warranty_expires_at')`,
  );
  const have = new Set((cols || []).map((r) => r.COLUMN_NAME));

  if (!have.has("is_warranty_available")) {
    await sequelize.query(
      "ALTER TABLE `products` ADD COLUMN `is_warranty_available` TINYINT(1) NOT NULL DEFAULT 0",
    );
    console.log("✅ Schema patch: added column products.is_warranty_available");
  }
  if (!have.has("warranty_expires_at")) {
    await sequelize.query(
      "ALTER TABLE `products` ADD COLUMN `warranty_expires_at` DATE NULL",
    );
    console.log("✅ Schema patch: added column products.warranty_expires_at");
  }
};

/** Sequelize sync alter may skip new columns on existing MySQL `products` table. */
const ensureProductMrpColumn = async () => {
  const [tables] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'`,
  );
  if (Number(tables[0]?.c ?? 0) === 0) return;

  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'mrp'`,
  );
  if (Number(rows[0]?.c ?? 0) > 0) return;

  await sequelize.query(
    "ALTER TABLE `products` ADD COLUMN `mrp` DECIMAL(12,2) NULL",
  );
  console.log("✅ Schema patch: added column products.mrp");
};

/**
 * Sequelize sync({ alter }) on MySQL may try to add an index on `product_id`
 * before the column exists on existing `invoices` tables. Ensure the column
 * exists first so sync can complete.
 */
const ensureInvoiceProductIdColumn = async () => {
  const [tables] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invoices'`,
  );
  if (Number(tables[0]?.c ?? 0) === 0) return;

  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invoices' AND COLUMN_NAME = 'product_id'`,
  );
  if (Number(rows[0]?.c ?? 0) > 0) return;

  await sequelize.query(
    "ALTER TABLE `invoices` ADD COLUMN `product_id` BIGINT UNSIGNED NULL",
  );
  console.log("✅ Schema patch: added column invoices.product_id");
};

const ensureBrandCatalogVerificationColumns = async () => {
  const [brandTables] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'brands'`,
  );
  if (Number(brandTables[0]?.c ?? 0) === 0) return;

  const [bCols] = await sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'brands'
       AND COLUMN_NAME IN ('is_verified', 'organisation_id')`,
  );
  const bHave = new Set((bCols || []).map((r) => r.COLUMN_NAME));
  if (!bHave.has("is_verified")) {
    await sequelize.query(
      "ALTER TABLE `brands` ADD COLUMN `is_verified` TINYINT(1) NOT NULL DEFAULT 1",
    );
    console.log("✅ Schema patch: added column brands.is_verified");
  }
  if (!bHave.has("organisation_id")) {
    await sequelize.query(
      "ALTER TABLE `brands` ADD COLUMN `organisation_id` BIGINT UNSIGNED NULL",
    );
    console.log("✅ Schema patch: added column brands.organisation_id");
  }

  const [mCols] = await sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'brand_models'
       AND COLUMN_NAME IN ('is_verified', 'organisation_id')`,
  );
  const mHave = new Set((mCols || []).map((r) => r.COLUMN_NAME));
  if (!mHave.has("is_verified")) {
    await sequelize.query(
      "ALTER TABLE `brand_models` ADD COLUMN `is_verified` TINYINT(1) NOT NULL DEFAULT 1",
    );
    console.log("✅ Schema patch: added column brand_models.is_verified");
  }
  if (!mHave.has("organisation_id")) {
    await sequelize.query(
      "ALTER TABLE `brand_models` ADD COLUMN `organisation_id` BIGINT UNSIGNED NULL",
    );
    console.log("✅ Schema patch: added column brand_models.organisation_id");
  }
};

/** Sequelize sync alter may skip new columns on existing MySQL `organisations` table. */
const ensureOrganisationGstNumberColumn = async () => {
  const [tables] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'organisations'`,
  );
  if (Number(tables[0]?.c ?? 0) === 0) return;

  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'organisations' AND COLUMN_NAME = 'gst_number'`,
  );
  if (Number(rows[0]?.c ?? 0) > 0) return;

  await sequelize.query(
    "ALTER TABLE `organisations` ADD COLUMN `gst_number` VARCHAR(20) NULL",
  );
  console.log("✅ Schema patch: added column organisations.gst_number");
};

module.exports = {
  sequelize,
  connectDB,
  syncDB,
  ensureMediaPublicTokenColumn,
  ensureProductWarrantyColumns,
  ensureProductMrpColumn,
  ensureBrandCatalogVerificationColumns,
  ensureInvoiceProductIdColumn,
  ensureOrganisationGstNumberColumn,
};
