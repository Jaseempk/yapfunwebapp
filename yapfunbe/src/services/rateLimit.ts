import { redis } from "../config/cache";
import { errorHandler } from "./error";

interface RateLimitConfig {
  points: number; // Number of requests allowed
  duration: number; // Time window in seconds
  blockDuration?: number; // How long to block if limit exceeded (seconds)
}

const DEFAULT_LIMITS: { [key: string]: RateLimitConfig } = {
  default: {
    points: 100,
    duration: 60, // 100 requests per minute
    blockDuration: 300, // 5 minutes block
  },
  auth: {
    points: 5,
    duration: 60, // 5 requests per minute
    blockDuration: 900, // 15 minutes block
  },
  trading: {
    points: 30,
    duration: 60, // 30 requests per minute
    blockDuration: 600, // 10 minutes block
  },
  query: {
    points: 300,
    duration: 60, // 300 requests per minute
    blockDuration: 300, // 5 minutes block
  },
};

export class RateLimiter {
  private generateKey(identifier: string, type: string): string {
    return `ratelimit:${type}:${identifier}`;
  }

  private async isBlocked(identifier: string, type: string): Promise<boolean> {
    const blockKey = this.generateKey(identifier, `${type}:blocked`);
    const blocked = await redis.get(blockKey);
    return Boolean(blocked);
  }

  private async block(
    identifier: string,
    type: string,
    duration: number
  ): Promise<void> {
    const blockKey = this.generateKey(identifier, `${type}:blocked`);
    await redis.setex(blockKey, duration, "1");
  }

  async checkLimit(
    identifier: string,
    type: string = "default"
  ): Promise<boolean> {
    const config = DEFAULT_LIMITS[type] || DEFAULT_LIMITS.default;
    const key = this.generateKey(identifier, type);

    // Check if already blocked
    if (await this.isBlocked(identifier, type)) {
      throw errorHandler.rateLimited(
        "Too many requests. Please try again later."
      );
    }

    const multi = redis.multi();
    multi.incr(key);
    multi.ttl(key);

    const [count, ttl] = (await multi.exec()) as [
      [Error | null, number],
      [Error | null, number]
    ];

    // Set expiry for new keys
    if (ttl[1] === -1) {
      await redis.expire(key, config.duration);
    }

    if (count[1] > config.points) {
      await this.block(identifier, type, config.blockDuration || 300);
      throw errorHandler.rateLimited(
        "Rate limit exceeded. Please try again later."
      );
    }

    return true;
  }

  // Middleware for GraphQL resolvers
  createMiddleware(type: string = "default") {
    return async (
      resolve: Function,
      root: any,
      args: any,
      context: any,
      info: any
    ) => {
      const identifier = context.user?.id || context.ip || "anonymous";
      await this.checkLimit(identifier, type);
      return resolve(root, args, context, info);
    };
  }

  // Helper to get remaining points
  async getRemainingPoints(
    identifier: string,
    type: string = "default"
  ): Promise<{
    remaining: number;
    reset: number;
    total: number;
  }> {
    const config = DEFAULT_LIMITS[type] || DEFAULT_LIMITS.default;
    const key = this.generateKey(identifier, type);

    const multi = redis.multi();
    multi.get(key);
    multi.ttl(key);

    const [[err1, current], [err2, ttl]] = (await multi.exec()) as [
      [Error | null, string | null],
      [Error | null, number]
    ];

    const used = current ? parseInt(current, 10) : 0;
    const remaining = Math.max(0, config.points - used);

    return {
      remaining,
      reset: Math.max(0, ttl),
      total: config.points,
    };
  }

  // Add custom rate limit type
  addLimitType(
    type: string,
    points: number,
    duration: number,
    blockDuration?: number
  ): void {
    DEFAULT_LIMITS[type] = {
      points,
      duration,
      blockDuration,
    };
  }

  // Clear rate limit for testing/admin purposes
  async clearLimit(
    identifier: string,
    type: string = "default"
  ): Promise<void> {
    const key = this.generateKey(identifier, type);
    const blockKey = this.generateKey(identifier, `${type}:blocked`);
    await redis.del(key, blockKey);
  }
}

export const rateLimiter = new RateLimiter();
