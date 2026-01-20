const { Sequelize } = require('sequelize');

/**
 * Sequelize database connection instance
 * Shared database connection for all modules
 */
const sequelize = new Sequelize(
  process.env.DB_NAME || 'talkntrade',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
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
  }
);

/**
 * Test database connection
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

/**
 * Sync database models (use with caution in production)
 * @param {boolean} force - Force sync (drops tables)
 * @param {boolean} alter - Alter tables to match models
 * @returns {Promise<void>}
 */
const syncDB = async (force = false, alter = false) => {
  try {
    await sequelize.sync({ force, alter });
    console.log('✅ Database models synchronized.');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  connectDB,
  syncDB,
};
