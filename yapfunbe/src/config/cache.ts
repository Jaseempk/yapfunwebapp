import Redis from "ioredis";

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    if (times > 3) {
      return null; // Stop retrying
    }
    return Math.min(times * 200, 2000); // Exponential backoff
  },
};

export const redis = new Redis(REDIS_CONFIG);

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  KOL: 300, // 5 minutes
  MARKET: 60, // 1 minute
  POSITION: 30, // 30 seconds
  ORDERBOOK: 10, // 10 seconds
  USER: 3600, // 1 hour
};

// Cache key prefixes
export const CACHE_PREFIX = {
  KOL: "kol:",
  MARKET: "market:",
  POSITION: "position:",
  ORDERBOOK: "orderbook:",
  USER: "user:",
};

// Helper functions
export const cacheUtils = {
  generateKey(prefix: string, identifier: string): string {
    return `${prefix}${identifier}`;
  },

  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      console.error("Cache parse error:", error);
      return null;
    }
  },

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (error) {
      console.error("Cache set error:", error);
    }
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

  // Cache with automatic TTL management
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;

    const fresh = await fetchFn();
    await this.set(key, fresh, ttl);
    return fresh;
  },

  // Batch operations
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const values = await redis.mget(keys);
    return values.map((value) => {
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    });
  },

  async mset(
    keyValues: { key: string; value: any; ttl?: number }[]
  ): Promise<void> {
    const pipeline = redis.pipeline();

    keyValues.forEach(({ key, value, ttl }) => {
      const serialized = JSON.stringify(value);
      if (ttl) {
        pipeline.setex(key, ttl, serialized);
      } else {
        pipeline.set(key, serialized);
      }
    });

    await pipeline.exec();
  },

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await redis.ping();
      return true;
    } catch (error) {
      console.error("Redis health check failed:", error);
      return false;
    }
  },
};
