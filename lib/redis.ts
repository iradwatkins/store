import Redis from 'ioredis';
import { logger } from "@/lib/logger"

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  throw new Error('REDIS_URL is not defined');
};

// Create Redis instance
const redis = new Redis(getRedisUrl(), {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('error', (error) => {
  logger.error("Redis Client Error:", error);
});

redis.on('connect', () => {
  logger.info("✅ Redis connected");
});

export default redis;
export { redis }; // Named export for compatibility

// Helper functions for common operations
export const redisHelpers = {
  // Cart operations
  async getCart(sessionId: string) {
    const cart = await redis.get(`cart:${sessionId}`);
    return cart ? JSON.parse(cart) : null;
  },

  async setCart(sessionId: string, cart: any, ttl = 604800) { // 7 days default
    await redis.setex(`cart:${sessionId}`, ttl, JSON.stringify(cart));
  },

  async deleteCart(sessionId: string) {
    await redis.del(`cart:${sessionId}`);
  },

  // Session operations
  async getSession(key: string) {
    const session = await redis.get(`session:${key}`);
    return session ? JSON.parse(session) : null;
  },

  async setSession(key: string, data: any, ttl = 86400) { // 24 hours default
    await redis.setex(`session:${key}`, ttl, JSON.stringify(data));
  },

  // Cache operations
  async getCached(key: string) {
    const cached = await redis.get(`cache:${key}`);
    return cached ? JSON.parse(cached) : null;
  },

  async setCached(key: string, data: any, ttl = 300) { // 5 minutes default
    await redis.setex(`cache:${key}`, ttl, JSON.stringify(data));
  },

  async invalidateCache(pattern: string) {
    const keys = await redis.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};
