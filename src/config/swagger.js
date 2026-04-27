const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TalkNTrade API",
      version: "1.0.0",
      description: "API documentation for TalkNTrade",
    },
    servers: [
      {
        url:
          process.env.SWAGGER_SERVER_URL ||
          "https://talkntrade-api.onrender.com",
        description: "Primary server",
      },
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [
    path.join(__dirname, "../docs/openapiPaths.js"),
    path.join(__dirname, "../routes/*.js"),
    path.join(__dirname, "../controllers/*.js"),
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;
