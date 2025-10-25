import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import searchRoutes from './routes/searchRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';

const app = express();

app.use(helmet());
app.use(cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'search-service',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', searchRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

export default app;
