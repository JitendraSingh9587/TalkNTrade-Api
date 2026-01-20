# TalkNTrade API

Node.js server with Swagger documentation and Nodemon for development.

## Installation

```bash
npm install
```

## Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE talkntrade;
```

2. Update `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=talkntrade
DB_USER=root
DB_PASSWORD=your_password
```

3. The server will automatically connect to the database on startup.

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
    │   └── database.js    # Sequelize database configuration
    ├── modules/           # Feature modules (Modular Monolith)
    │   └── {moduleName}/
    │       ├── controllers/
    │       ├── services/
    │       ├── models/    # Module-specific models
    │       ├── routes/
    │       ├── validators/
    │       └── entities/
    ├── shared/            # Shared code across modules
    │   ├── models/       # Shared model exports
    │   ├── utils/
    │   └── services/
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
