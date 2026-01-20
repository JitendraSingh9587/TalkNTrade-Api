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
 * Sync database models
 * Creates tables if they don't exist, alters them if alter=true
 * @param {boolean} force - Force sync (drops all tables - USE WITH CAUTION!)
 * @param {boolean} alter - Alter tables to match models (adds missing columns)
 * @returns {Promise<void>}
 */
const syncDB = async (force = false, alter = false) => {
  try {
    if (force) {
      console.warn('⚠️  WARNING: Force sync will DROP all tables!');
    }
    
    await sequelize.sync({ 
      force, 
      alter,
      // Only create tables, don't drop existing ones
      match: /.*/,
    });
    
    if (force) {
      console.log('✅ Database tables created (force sync).');
    } else if (alter) {
      console.log('✅ Database tables synchronized (altered to match models).');
    } else {
      console.log('✅ Database tables verified/created.');
    }
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
