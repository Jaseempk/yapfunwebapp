import {
  KOLAPIResponse,
  KaitoKOL,
  KOL,
  KOLStats,
  KOLTrade,
  Duration,
  DurationMap,
} from "../types/kol";
import { cacheUtils, CACHE_TTL, CACHE_PREFIX } from "../config/cache";
import { errorHandler } from "./error";
import { getMarketDeploymentService } from "./market/deployment";
import { subgraphService } from "./subgraph";

export class KOLService {
  constructor() {}

  private readonly baseUrl =
    process.env.KAITO_API_URL || "https://hub.kaito.ai/api/v1/gateway/ai";

  private generateCacheKey(
    duration: string,
    topicId: string,
    topN: number
  ): string {
    return cacheUtils.generateKey(
      CACHE_PREFIX.KOL,
      `top_kols:${duration}:${topicId}:${topN}`
    );
  }

  async transformKaitoKOL(kaitoKOL: KaitoKOL): Promise<KOL> {
    try {
      const marketDeploymentService = getMarketDeploymentService();
      let marketAddress = "";
      let volume = 0;
      let trades = 0;
      let pnl = 0;

      try {
        marketAddress = await marketDeploymentService.getMarketAddress(
          kaitoKOL.user_id
        );

        if (marketAddress) {
          // Get all market data in a single call
          const positions = await subgraphService.getMarketPositions(
            marketAddress
          );
          volume = await subgraphService.getMarketVolume(marketAddress);
          trades = positions.length;
          pnl = positions.reduce((total, pos) => total + (pos.pnl || 0), 0);
        }
      } catch (error) {
        // Market might not exist yet, which is fine
        if (
          !(error instanceof Error && error.message.includes("No market found"))
        ) {
          console.error("Error fetching market data:", error);
        }
      }

      // Transform data
      return {
        address: "", // Will be populated from contract data
        marketAddress,
        mindshare: Number(kaitoKOL.mindshare || 0),
        rank: kaitoKOL.rank || "0",
        volume: Number(volume || 0),
        trades: Number(trades || 0),
        pnl: Number(pnl || 0),
        followers: Number(kaitoKOL.follower_count || 0),
        following: Number(kaitoKOL.following_count || 0),
        user_id: kaitoKOL.user_id,
        name: kaitoKOL.name || kaitoKOL.username || kaitoKOL.user_id,
        username: kaitoKOL.username || "",
        icon: kaitoKOL.icon || "",
        bio: kaitoKOL.bio || "",
        twitter_url: kaitoKOL.twitter_user_url || "",
        last_7_day_mention_count: Number(
          kaitoKOL.last_7_day_mention_count || 0
        ),
      };
    } catch (error) {
      console.error("Error transforming KOL data:", error);
      throw errorHandler.handle(error);
    }
  }

  async getKOLs(limit?: number, offset?: number): Promise<KOL[]> {
    try {
      const response = await this.getTopKOLsWithCache();
      let kols = await Promise.all(
        response.data.data.map((kol) => this.transformKaitoKOL(kol))
      );

      // Sort by volume in descending order
      kols.sort((a, b) => b.volume - a.volume);

      // Apply pagination if provided
      if (typeof offset === "number") {
        kols = kols.slice(offset);
      }
      if (typeof limit === "number") {
        kols = kols.slice(0, limit);
      }

      return kols;
    } catch (error) {
      console.error("Error in getKOLs:", error);
      throw errorHandler.handle(error);
    }
  }

  async getKOL(id: string): Promise<KOL | null> {
    try {
      const kols = await this.getKOLs();
      return kols.find((kol) => kol.user_id === id) || null;
    } catch (error) {
      console.error(`Error in getKOL for id ${id}:`, error);
      throw errorHandler.handle(error);
    }
  }

  async getKOLStats(id: string): Promise<KOLStats> {
    try {
      const kol = await this.getKOL(id);
      if (!kol) {
        throw new Error(`KOL not found with id ${id}`);
      }

      return {
        mindshare: kol.mindshare,
        rank: kol.rank,
        volume: kol.volume,
        trades: kol.trades,
        pnl: kol.pnl,
        followers: kol.followers,
        following: kol.following,
      };
    } catch (error) {
      console.error(`Error in getKOLStats for id ${id}:`, error);
      throw errorHandler.handle(error);
    }
  }

  async getKOLTrades(
    id: string,
    limit?: number,
    offset?: number
  ): Promise<KOLTrade[]> {
    try {
      const kol = await this.getKOL(id);
      if (!kol || !kol.marketAddress) {
        return [];
      }

      const positions = await subgraphService.getMarketPositions(
        kol.marketAddress
      );
      let trades = positions.map((position) => ({
        id: position.id,
        timestamp: position.createdAt,
        type: position.type === "LONG" ? "BUY" : "SELL",
        amount: position.amount,
        price: position.entryPrice,
        pnl: position.pnl || 0,
      }));
      if (typeof offset === "number") {
        trades = trades.slice(offset);
      }
      if (typeof limit === "number") {
        trades = trades.slice(0, limit);
      }

      return trades;
    } catch (error) {
      console.error(`Error in getKOLTrades for id ${id}:`, error);
      throw errorHandler.handle(error);
    }
  }

  async getTopKOLs(
    duration: Duration = Duration.SEVEN_DAYS,
    topicId: string = "",
    topN: number = 100
  ): Promise<KOLAPIResponse> {
    const startTime = Date.now();

    try {
      const durationStr = DurationMap[duration];
      console.log(`[KOL Service] Fetching data from ${this.baseUrl}`);

      const response = await fetch(
        `${this.baseUrl}?duration=${durationStr}&topic_id=${topicId}&top_n=${topN}`,
        {
          method: "POST",
          headers: {
            accept: "application/json, text/plain, */*",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            path: "/api/yapper/public_kol_mindshare_leaderboard",
            method: "GET",
            params: {
              duration: durationStr,
              topicid: topicId,
              topn: topN,
            },
            body: {},
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[KOL Service] API Error:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(
          `HTTP error! Status: ${response.status}, Error: ${errorText}`
        );
      }

      const data = await response.json();
      console.log(`[KOL Service] Received data:`, data);

      const latency = (Date.now() - startTime) / 1000; // Convert ms to seconds

      return {
        data: {
          data: data,
        },
        latency,
      };
    } catch (error) {
      console.error("[KOL Service] Error fetching KOL data:", error);
      throw errorHandler.handle(error);
    }
  }

  async getTopKOLsWithCache(
    duration: Duration = Duration.SEVEN_DAYS,
    topicId: string = "",
    topN: number = 100
  ): Promise<KOLAPIResponse> {
    const durationStr = DurationMap[duration];
    const cacheKey = this.generateCacheKey(durationStr, topicId, topN);

    try {
      return await cacheUtils.getOrSet<KOLAPIResponse>(
        cacheKey,
        () => this.getTopKOLs(duration, topicId, topN),
        CACHE_TTL.KOL
      );
    } catch (error) {
      console.error("[KOL Service] Error in getTopKOLsWithCache:", error);
      throw errorHandler.handle(error);
    }
  }

  // Clear cache for specific parameters
  async clearCache(
    duration?: Duration,
    topicId?: string,
    topN?: number
  ): Promise<void> {
    try {
      if (duration && topicId && topN) {
        // Clear specific cache entry
        const durationStr = DurationMap[duration];
        const cacheKey = this.generateCacheKey(durationStr, topicId, topN);
        await cacheUtils.del(cacheKey);
      } else {
        // Clear all KOL-related cache
        await cacheUtils.clearPrefix(CACHE_PREFIX.KOL);
      }
    } catch (error) {
      console.error("[KOL Service] Error clearing KOL cache:", error);
      throw errorHandler.handle(error);
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.getTopKOLs(Duration.ONE_DAY, "", 1);
      return response.data && Array.isArray(response.data.data);
    } catch (error) {
      console.error("[KOL Service] Health check failed:", error);
      return false;
    }
  }
}

export const kolService = new KOLService();
