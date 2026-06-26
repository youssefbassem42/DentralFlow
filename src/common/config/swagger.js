import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dental Clinic Management System (DCMS) API',
      version: '1.0.0',
      description: 'API Documentation for the Dental Clinic Management System (DCMS) backend.',
      contact: {
        name: 'API Support',
        email: 'support@dcms.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Document all route files and module JSDoc annotations
  apis: ['./src/routes/*.js', './src/modules/**/*.js', './src/app.js'],
};

export const swaggerSpec = swaggerJSDoc(options);
