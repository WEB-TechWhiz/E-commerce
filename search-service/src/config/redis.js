import redis from 'redis';

let redisClient;

export const connectRedis = async () => {
  try {
    redisClient = redis.createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    console.log('Redis Connected');
    return redisClient;
  } catch (err) {
    console.error('Redis connection failed:', err);
    return null;
  }
};

export const getRedisClient = () => redisClient;
