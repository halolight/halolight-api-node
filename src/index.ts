import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './utils/logger';
import routes from './routes';
import { errorHandler, notFound } from './middleware/error';
import { getHomePage, getHealthResponse } from './utils/home';
import { setupSwagger } from './config/swagger';

// Create Express app
const app: Express = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({ origin: env.CORS_ORIGIN })); // CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(
  pinoHttp({
    logger,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'req.headers["set-cookie"]'],
      remove: true,
    },
  })
); // Request logging with sensitive header redaction

// Mount API routes
app.use('/api', routes);

// Setup Swagger documentation
setupSwagger(app);

// Root endpoint - Beautiful HTML homepage
app.get('/', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(getHomePage());
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json(getHealthResponse());
});

// Error handling
app.use(notFound); // 404 handler
app.use(errorHandler); // Global error handler

// Start server
const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Server running on port ${env.PORT}`);
  logger.info(`📝 Environment: ${env.NODE_ENV}`);
  logger.info(`🔗 API URL: http://localhost:${env.PORT}/api`);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down server...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
