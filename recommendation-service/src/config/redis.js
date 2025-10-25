import redis from 'redis';
import logger from '../utils/logger.js';

let redisClient;

export const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection limit exceeded');
          }
          return retries * 100;
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Connected Successfully');
    });

    await redisClient.connect();
    return redisClient;
  } catch (err) {
    logger.error('Redis connection failed:', err.message);
    return null;
  }
};

export const getRedisClient = () => redisClient;