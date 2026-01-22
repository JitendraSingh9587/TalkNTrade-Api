require('dotenv').config();

const app = require('./src/app');
const { connectDB, syncDB } = require('./src/config/database');
const { seedSettings } = require('./src/seeders/settingsSeeder');
const settingsCache = require('./src/shared/services/settingsCache');

// Import all models to register them with Sequelize
require('./src/models');

const PORT = process.env.PORT || 3000;

// Start server with database connection
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Sync database models (create tables if they don't exist)
    // alter: true - alters tables to match models without dropping data
    // Set DB_SYNC_ALTER=false in .env to disable auto-alter in production
    const shouldAlter = process.env.DB_SYNC_ALTER !== 'false';
    await syncDB(false, shouldAlter);

    // Seed settings (JWT secrets, etc.)
    await seedSettings();

    // Load settings into cache
    await settingsCache.loadSettings();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📚 Swagger documentation available at http://localhost:${PORT}/api-docs`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
