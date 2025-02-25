import { redis } from "../config/cache";
import { errorHandler } from "./error";

const RATE_LIMIT_PREFIX = "rate_limit:";
const DEFAULT_LIMIT = 100; // requests per window
const DEFAULT_WINDOW = 60; // seconds

interface RateLimitConfig {
  limit: number;
  window: number;
}

const ENDPOINT_CONFIGS: { [key: string]: RateLimitConfig } = {
  graphql: {
    limit: DEFAULT_LIMIT,
    window: DEFAULT_WINDOW,
  },
};

export const rateLimiter = {
  async checkLimit(identifier: string, endpoint: string): Promise<void> {
    try {
      const config = ENDPOINT_CONFIGS[endpoint] || {
        limit: DEFAULT_LIMIT,
        window: DEFAULT_WINDOW,
      };

      const key = `${RATE_LIMIT_PREFIX}${endpoint}:${identifier}`;
      const current = await redis.incr(key);

      // Set expiry on first request
      if (current === 1) {
        await redis.expire(key, config.window);
      }

      if (current > config.limit) {
        throw new Error(
          `Rate limit exceeded. Try again in ${config.window} seconds.`
        );
      }
    } catch (error) {
      console.error("Rate limit error:", error);
      throw errorHandler.handle(error);
    }
  },

  async clearLimit(identifier: string, endpoint: string): Promise<void> {
    try {
      const key = `${RATE_LIMIT_PREFIX}${endpoint}:${identifier}`;
      await redis.del(key);
    } catch (error) {
      console.error("Error clearing rate limit:", error);
      throw errorHandler.handle(error);
    }
  },

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const testKey = `${RATE_LIMIT_PREFIX}health`;
      await redis.setex(testKey, 5, "1");
      const result = await redis.get(testKey);
      await redis.del(testKey);
      return result === "1";
    } catch (error) {
      console.error("Rate limiter health check failed:", error);
      return false;
    }
  },
};
