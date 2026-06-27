import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { env } from './common/config/env.js';
import { swaggerSpec } from './common/config/swagger.js';
import { requestLogger } from './common/middleware/requestLogger.js';
import { errorHandler } from './common/middleware/errorHandler.js';
import router from './routes/index.js';
import { NotFoundError } from './common/errors/AppError.js';

const app = express();

// 1. Security Middleware
app.use(helmet());
app.use(cors());

// 2. Rate Limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    data: null,
    errors: [],
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 3. Performance & Parsing Middleware
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Request Logging
app.use(requestLogger);

// 5. Swagger documentation API docs endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 6. Routes
app.use('/api/v1', router);

// Root redirect/alias to health endpoint
app.get('/health', (req, res) => {
  res.redirect('/api/v1/health');
});

// 7. 404 Route handler
app.use((req, res, next) => {
  next(new NotFoundError(`Cannot find ${req.method} ${req.originalUrl} on this server`));
});

// 8. Global Error Handler Middleware
app.use(errorHandler);

export default app;
