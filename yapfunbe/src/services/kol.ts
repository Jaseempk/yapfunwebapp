import { KOLAPIResponse } from "../types/kol";
import { cacheUtils, CACHE_TTL, CACHE_PREFIX } from "../config/cache";
import { errorHandler } from "./error";

export class KOLService {
  private readonly baseUrl = "https://hub.kaito.ai/api/v1/gateway/ai";

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

  async getTopKOLs(
    duration: string = "7d",
    topicId: string = "",
    topN: number = 100
  ): Promise<KOLAPIResponse> {
    const startTime = Date.now();

    try {
      const response = await fetch(
        `${this.baseUrl}?duration=${duration}&topic_id=${topicId}&top_n=${topN}`,
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
              duration,
              topicid: topicId,
              topn: topN,
            },
            body: {},
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! Status: ${response.status}, Response: ${errorText}`
        );
      }

      const data = await response.json();
      const latency = (Date.now() - startTime) / 1000; // Convert ms to seconds

      return {
        data,
        latency,
      };
    } catch (error) {
      console.error("Error fetching KOL data:", error);
      throw errorHandler.handle(error);
    }
  }

  async getTopKOLsWithCache(
    duration: string = "7d",
    topicId: string = "",
    topN: number = 100
  ): Promise<KOLAPIResponse> {
    const cacheKey = this.generateCacheKey(duration, topicId, topN);

    try {
      return await cacheUtils.getOrSet<KOLAPIResponse>(
        cacheKey,
        () => this.getTopKOLs(duration, topicId, topN),
        CACHE_TTL.KOL
      );
    } catch (error) {
      console.error("Error in getTopKOLsWithCache:", error);
      throw errorHandler.handle(error);
    }
  }

  // Clear cache for specific parameters
  async clearCache(
    duration?: string,
    topicId?: string,
    topN?: number
  ): Promise<void> {
    try {
      if (duration && topicId && topN) {
        // Clear specific cache entry
        const cacheKey = this.generateCacheKey(duration, topicId, topN);
        await cacheUtils.del(cacheKey);
      } else {
        // Clear all KOL-related cache
        await cacheUtils.clearPrefix(CACHE_PREFIX.KOL);
      }
    } catch (error) {
      console.error("Error clearing KOL cache:", error);
      throw errorHandler.handle(error);
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.getTopKOLs("1d", "", 1);
      return response.data && Array.isArray(response.data.data);
    } catch (error) {
      console.error("KOL service health check failed:", error);
      return false;
    }
  }
}

export const kolService = new KOLService();
