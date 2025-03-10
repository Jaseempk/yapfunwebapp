import Redis from "ioredis";
import { errorHandler } from "../services/error";

const CACHE_VERSION = "v1";
const STALE_TTL_MULTIPLIER = 1.5; // Consider data stale after 1.5x TTL

let redisConfig: any;

if (process.env.REDIS_URL) {
  // Use Render's Redis URL format
  redisConfig = {
    url: process.env.REDIS_URL,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    reconnectOnError: (err: Error) => {
      const targetError = "READONLY";
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    }
  };
} else {
  // Use traditional configuration for local development
  redisConfig = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true
  };
}

export const redis = new Redis(redisConfig);

// Monitor Redis connection
redis.on("error", (error) => {
  console.error("Redis connection error:", error);
});

redis.on("connect", () => {
  console.log("Connected to Redis");
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
  MARKET_CYCLE: 3 * 24 * 60 * 60 // 3 days
};

export const cacheUtils = {
  generateKey(prefix: string, key: string): string {
    return `${CACHE_VERSION}:${prefix}${key}`;
  },

  async getOrSet<T>(
    key: string,
    getter: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    try {
      const cached = await redis.get(key);
      if (cached) {
        // Check if data is stale
        const metadata = await redis.ttl(key);
        const isStale = metadata < ttl * STALE_TTL_MULTIPLIER;
        
        // If data is stale, trigger background refresh
        if (isStale) {
          this._refreshCache(key, getter, ttl).catch(console.error);
        }
        
        return JSON.parse(cached);
      }

      const value = await getter();
      await redis.setex(key, ttl, JSON.stringify(value));
      return value;
    } catch (error: any) {
      throw errorHandler.handle(error);
    }
  },

  async _refreshCache<T>(
    key: string,
    getter: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    try {
      const value = await getter();
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to refresh cache for key ${key}:`, error);
    }
  },

  async mgetOrSet<T>(
    keys: string[],
    getter: (missingKeys: string[]) => Promise<Record<string, T>>,
    ttl: number
  ): Promise<Record<string, T>> {
    try {
      // Get all cached values
      const cachedValues = await redis.mget(keys);
      const result: Record<string, T> = {};
      const missingKeys: string[] = [];

      // Process cached values
      keys.forEach((key, index) => {
        const cached = cachedValues[index];
        if (cached) {
          result[key] = JSON.parse(cached);
        } else {
          missingKeys.push(key);
        }
      });

      // If we have missing keys, fetch them
      if (missingKeys.length > 0) {
        const newValues = await getter(missingKeys);
        
        // Cache new values
        const pipeline = redis.pipeline();
        Object.entries(newValues).forEach(([key, value]) => {
          result[key] = value;
          pipeline.setex(key, ttl, JSON.stringify(value));
        });
        await pipeline.exec();
      }

      return result;
    } catch (error: any) {
      throw errorHandler.handle(error);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error: any) {
      throw errorHandler.handle(error);
    }
  },

  async clearPrefix(prefix: string): Promise<void> {
    try {
      const keys = await redis.keys(`${CACHE_VERSION}:${prefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error: any) {
      throw errorHandler.handle(error);
    }
  },

  async healthCheck(): Promise<boolean> {
    try {
      const testKey = `${CACHE_VERSION}:health_check`;
      await redis.setex(testKey, 5, "1");
      const result = await redis.get(testKey);
      await redis.del(testKey);
      return result === "1";
    } catch (error: any) {
      console.error("Cache health check failed:", error);
      return false;
    }
  },
};
