import { redis } from "../config/cache";
import { CACHE_PREFIX, CACHE_TTL } from "../config/cache";

interface TradeMetrics {
  volume: number;
  count: number;
  avgSize: number;
  pnl: number;
}

interface UserMetrics {
  trades: TradeMetrics;
  followers: number;
  following: number;
  lastActive: string;
}

interface MarketMetrics {
  volume: number;
  trades: number;
  uniqueTraders: number;
  avgPrice: number;
  highPrice: number;
  lowPrice: number;
}

export class AnalyticsService {
  // Time windows for metrics
  private readonly TIME_WINDOWS = ["1h", "24h", "7d", "30d", "all"] as const;

  // User Analytics
  async trackUserTrade(
    userId: string,
    tradeAmount: number,
    pnl: number
  ): Promise<void> {
    const now = new Date().toISOString();

    // Update metrics for each time window
    for (const window of this.TIME_WINDOWS) {
      const key = `${CACHE_PREFIX.USER}${userId}:trades:${window}`;
      const metrics = await this.getUserTradeMetrics(userId, window);

      const updated: TradeMetrics = {
        volume: metrics.volume + Math.abs(tradeAmount),
        count: metrics.count + 1,
        avgSize: (metrics.volume + Math.abs(tradeAmount)) / (metrics.count + 1),
        pnl: metrics.pnl + (pnl || 0),
      };

      await redis.hset(key, updated);

      // Set expiry for time-bound windows
      if (window !== "all") {
        const ttl = this.getWindowTTL(window);
        await redis.expire(key, ttl);
      }
    }

    // Update last active timestamp
    await redis.set(
      `${CACHE_PREFIX.USER}${userId}:lastActive`,
      now,
      "EX",
      CACHE_TTL.USER
    );
  }

  async getUserTradeMetrics(
    userId: string,
    timeWindow: (typeof this.TIME_WINDOWS)[number] = "all"
  ): Promise<TradeMetrics> {
    const key = `${CACHE_PREFIX.USER}${userId}:trades:${timeWindow}`;
    const data = await redis.hgetall(key);

    return {
      volume: parseFloat(data.volume || "0"),
      count: parseInt(data.count || "0", 10),
      avgSize: parseFloat(data.avgSize || "0"),
      pnl: parseFloat(data.pnl || "0"),
    };
  }

  async getUserMetrics(userId: string): Promise<UserMetrics> {
    const [trades, followers, following, lastActive] = await Promise.all([
      this.getUserTradeMetrics(userId),
      redis.scard(`${CACHE_PREFIX.USER}${userId}:followers`),
      redis.scard(`${CACHE_PREFIX.USER}${userId}:following`),
      redis.get(`${CACHE_PREFIX.USER}${userId}:lastActive`),
    ]);

    return {
      trades,
      followers,
      following,
      lastActive: lastActive || new Date(0).toISOString(),
    };
  }

  // Market Analytics
  async trackMarketTrade(
    marketId: string,
    tradeAmount: number,
    price: number,
    traderId: string
  ): Promise<void> {
    for (const window of this.TIME_WINDOWS) {
      const key = `${CACHE_PREFIX.MARKET}${marketId}:metrics:${window}`;
      const metrics = await this.getMarketMetrics(marketId, window);

      // Add trader to unique traders set
      const tradersKey = `${CACHE_PREFIX.MARKET}${marketId}:traders:${window}`;
      await redis.sadd(tradersKey, traderId);

      const updated: MarketMetrics = {
        volume: metrics.volume + Math.abs(tradeAmount),
        trades: metrics.trades + 1,
        uniqueTraders: await redis.scard(tradersKey),
        avgPrice:
          (metrics.avgPrice * metrics.trades + price) / (metrics.trades + 1),
        highPrice: Math.max(metrics.highPrice, price),
        lowPrice:
          metrics.lowPrice === 0 ? price : Math.min(metrics.lowPrice, price),
      };

      await redis.hset(key, updated);

      // Set expiry for time-bound windows
      if (window !== "all") {
        const ttl = this.getWindowTTL(window);
        await redis.expire(key, ttl);
        await redis.expire(tradersKey, ttl);
      }
    }
  }

  async getMarketMetrics(
    marketId: string,
    timeWindow: (typeof this.TIME_WINDOWS)[number] = "all"
  ): Promise<MarketMetrics> {
    const key = `${CACHE_PREFIX.MARKET}${marketId}:metrics:${timeWindow}`;
    const data = await redis.hgetall(key);

    return {
      volume: parseFloat(data.volume || "0"),
      trades: parseInt(data.trades || "0", 10),
      uniqueTraders: parseInt(data.uniqueTraders || "0", 10),
      avgPrice: parseFloat(data.avgPrice || "0"),
      highPrice: parseFloat(data.highPrice || "0"),
      lowPrice: parseFloat(data.lowPrice || "0"),
    };
  }

  // Social Analytics
  async trackFollow(followerId: string, followedId: string): Promise<void> {
    const followersKey = `${CACHE_PREFIX.USER}${followedId}:followers`;
    const followingKey = `${CACHE_PREFIX.USER}${followerId}:following`;

    await Promise.all([
      redis.sadd(followersKey, followerId),
      redis.sadd(followingKey, followedId),
    ]);
  }

  async trackUnfollow(followerId: string, followedId: string): Promise<void> {
    const followersKey = `${CACHE_PREFIX.USER}${followedId}:followers`;
    const followingKey = `${CACHE_PREFIX.USER}${followerId}:following`;

    await Promise.all([
      redis.srem(followersKey, followerId),
      redis.srem(followingKey, followedId),
    ]);
  }

  async getFollowers(userId: string): Promise<string[]> {
    return redis.smembers(`${CACHE_PREFIX.USER}${userId}:followers`);
  }

  async getFollowing(userId: string): Promise<string[]> {
    return redis.smembers(`${CACHE_PREFIX.USER}${userId}:following`);
  }

  // Trending Analytics
  async updateTrendingScore(
    marketId: string,
    score: number,
    timeWindow: (typeof this.TIME_WINDOWS)[number] = "24h"
  ): Promise<void> {
    const key = `trending:markets:${timeWindow}`;
    await redis.zadd(key, score, marketId);

    if (timeWindow !== "all") {
      const ttl = this.getWindowTTL(timeWindow);
      await redis.expire(key, ttl);
    }
  }

  async getTrendingMarkets(
    timeWindow: (typeof this.TIME_WINDOWS)[number] = "24h",
    limit: number = 10
  ): Promise<string[]> {
    const key = `trending:markets:${timeWindow}`;
    return redis.zrevrange(key, 0, limit - 1);
  }

  // Helper methods
  private getWindowTTL(window: (typeof this.TIME_WINDOWS)[number]): number {
    const TTL_MAP = {
      "1h": 3600,
      "24h": 86400,
      "7d": 604800,
      "30d": 2592000,
      all: 0,
    };
    return TTL_MAP[window];
  }

  // Cleanup methods
  async clearUserMetrics(userId: string): Promise<void> {
    const keys = await redis.keys(`${CACHE_PREFIX.USER}${userId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  async clearMarketMetrics(marketId: string): Promise<void> {
    const keys = await redis.keys(`${CACHE_PREFIX.MARKET}${marketId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

export const analyticsService = new AnalyticsService();
