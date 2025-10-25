import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

import recommendationRoutes from './routes/recommendationRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import logger from './utils/logger.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
  }));
}

// Rate limiting
app.use('/api/', generalLimiter);

// Routes
app.use('/api/recommendations', recommendationRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Recommendation Service',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      health: '/api/recommendations/health',
      docs: '/api/recommendations/docs',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Error handling
app.use(errorHandler);

export default app;
