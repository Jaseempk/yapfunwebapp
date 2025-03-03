import Redis from "ioredis";

export const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
});

export const CACHE_PREFIX = {
  KOL: "kol:",
  MARKET: "market:",
  POSITION: "position:",
  ORDERBOOK: "orderbook:",
  USER: "user:",
  AUTH: "auth:",
};

export const CACHE_TTL = {
  KOL: 300, // 5 minutes
  MARKET: 60, // 1 minute
  POSITION: 60, // 1 minute
  ORDERBOOK: 30, // 30 seconds
  USER: 3600, // 1 hour
  AUTH: 86400, // 24 hours
  MARKET_CYCLE: 3 * 24 * 60 * 60
};

export const cacheUtils = {
  generateKey(prefix: string, key: string): string {
    return `${prefix}${key}`;
  },

  async getOrSet<T>(
    key: string,
    getter: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    const value = await getter();
    await redis.setex(key, ttl, JSON.stringify(value));
    return value;
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async clearPrefix(prefix: string): Promise<void> {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },

  async healthCheck(): Promise<boolean> {
    try {
      const testKey = "health_check";
      await redis.setex(testKey, 5, "1");
      const result = await redis.get(testKey);
      await redis.del(testKey);
      return result === "1";
    } catch (error) {
      console.error("Cache health check failed:", error);
      return false;
    }
  },
};
