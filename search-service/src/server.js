import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import elasticClient from './services/elasticClient.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await elasticClient.initialize();
    logger.info('Elasticsearch initialized successfully');

    app.listen(PORT, () => {
      logger.info(`Search service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();
