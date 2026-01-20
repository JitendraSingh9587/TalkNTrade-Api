# TalkNTrade API

Node.js server with Swagger documentation and Nodemon for development.

## Installation

```bash
npm install
```

## Development

Run the server with auto-reload:

```bash
npm run dev
```

## Production

Run the server:

```bash
npm start
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:3000/api-docs
- Health Check: http://localhost:3000/api/health
- Root: http://localhost:3000/api/

## Project Structure

```
.
├── server.js              # Entry point - starts the server
├── package.json           # Dependencies and scripts
├── nodemon.json           # Nodemon configuration
├── .env                   # Environment variables
├── .env.example           # Environment variables template
└── src/
    ├── app.js             # Express app configuration
    ├── config/
    │   ├── swagger.js     # Swagger configuration
    │   └── database.js    # Database configuration
    ├── controllers/       # Request handlers
    │   └── healthController.js
    ├── routes/            # API routes
    │   ├── index.js       # Main routes file
    │   └── healthRoutes.js
    ├── models/            # Database models
    │   └── index.js
    ├── services/          # Business logic layer
    │   └── index.js
    ├── middleware/        # Custom middleware
    │   ├── errorHandler.js
    │   └── logger.js
    ├── utils/             # Utility functions
    │   ├── response.js
    │   └── asyncHandler.js
    └── validators/        # Request validation schemas
        └── index.js
```

## Architecture

- **Controllers**: Handle HTTP requests and responses
- **Routes**: Define API endpoints and map them to controllers
- **Services**: Contain business logic (separated from controllers)
- **Models**: Database schemas and models
- **Middleware**: Custom Express middleware (error handling, logging, etc.)
- **Utils**: Reusable utility functions
- **Validators**: Request validation schemas
- **Config**: Configuration files (Swagger, database, etc.)
