const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const healthRoutes = require('./healthRoutes');
const userRoutes = require('./userRoutes');
const settingsRoutes = require('./settingsRoutes');
const authRoutes = require('./authRoutes');

// Mount routes
router.use('/', healthRoutes);
router.use('/v1/auth', authRoutes);
router.use('/v1/users', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), userRoutes);
router.use('/v1/settings', authenticate, authorize('SUPER_ADMIN'), settingsRoutes);

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to TalkNTrade API',
    documentation: '/api-docs',
    version: '1.0.0',
  });
});

module.exports = router;
