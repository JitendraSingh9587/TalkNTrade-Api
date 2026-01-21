require('dotenv').config();

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const logger = require('./middleware/logger');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Handle JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format. Please check your request body.',
      error: {
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { details: 'Common issues: trailing commas, unquoted keys, or invalid JSON syntax' }),
      },
    });
  }
  next(err);
});

app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to TalkNTrade API',
    documentation: '/api-docs',
    api: '/api',
    version: '1.0.0',
  });
});

// Routes
app.use('/api', routes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
