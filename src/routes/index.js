const express = require('express');
const router = express.Router();
const healthRoutes = require('./healthRoutes');
const userRoutes = require('../modules/users/routes/userRoutes');

// Mount routes
router.use('/', healthRoutes);
router.use('/v1/users', userRoutes);

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to TalkNTrade API',
    documentation: '/api-docs',
    version: '1.0.0',
  });
});

module.exports = router;
