const express = require('express');
const router = express.Router();
const healthRoutes = require('./healthRoutes');
const userRoutes = require('./userRoutes');
const settingsRoutes = require('./settingsRoutes');

// Mount routes
router.use('/', healthRoutes);
router.use('/v1/users', userRoutes);
router.use('/v1/settings', settingsRoutes);

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to TalkNTrade API',
    documentation: '/api-docs',
    version: '1.0.0',
  });
});

module.exports = router;
