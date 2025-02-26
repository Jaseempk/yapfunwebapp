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
import { ethers } from "ethers";
import { orderBookAbi } from "../abi/orderBook";

export class KOLService {
  private provider: ethers.providers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  }

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

  private async transformKaitoKOL(kaitoKOL: KaitoKOL): Promise<KOL> {
    const marketDeploymentService = getMarketDeploymentService();
    const marketAddress = await marketDeploymentService.getMarketAddress(
      kaitoKOL.user_id
    );

    let volume = 0;
    if (marketAddress) {
      try {
        const orderBook = new ethers.Contract(
          marketAddress,
          orderBookAbi,
          this.provider
        );
        const marketVolume = await orderBook.marketVolume();
        volume = parseFloat(ethers.utils.formatUnits(marketVolume, 6)); // Assuming USDC decimals
      } catch (error) {
        console.error(
          `Error fetching volume for KOL ${kaitoKOL.user_id}:`,
          error
        );
      }
    }

    return {
      address: "", // Will be populated from contract data
      marketAddress,
      mindshare: kaitoKOL.mindshare,
      rank: parseInt(kaitoKOL.rank),
      volume,
      trades: 0, // Will be populated from contract data
      pnl: 0, // Will be populated from contract data
      followers: kaitoKOL.follower_count,
      following: kaitoKOL.following_count,
      user_id: kaitoKOL.user_id,
      name: kaitoKOL.name,
      username: kaitoKOL.username,
      icon: kaitoKOL.icon,
      bio: kaitoKOL.bio,
      twitter_url: kaitoKOL.twitter_user_url,
      last_7_day_mention_count: kaitoKOL.last_7_day_mention_count,
    };
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
      // TODO: Implement actual trade fetching from contract/subgraph
      const mockTrades: KOLTrade[] = [
        {
          id: "1",
          timestamp: new Date().toISOString(),
          type: "BUY",
          amount: 100,
          price: 50000,
          pnl: 1000,
        },
      ];

      let trades = mockTrades;
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
