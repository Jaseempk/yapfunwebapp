import { KOLAPIResponse } from "../types/kol";

export class KOLService {
  private readonly baseUrl = "https://hub.kaito.ai/api/v1/gateway/ai";

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
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const latency = (Date.now() - startTime) / 1000; // Convert ms to seconds

      console.log(`KOL API Response Latency: ${latency.toFixed(3)} seconds`);

      return {
        data,
        latency,
      };
    } catch (error) {
      console.error("Error fetching KOL data:", error);
      throw error;
    }
  }

  // Cache the response in memory for a short duration to avoid hitting rate limits
  private cache: {
    data: any;
    timestamp: number;
    latency: number;
  } | null = null;

  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  async getTopKOLsWithCache(
    duration: string = "7d",
    topicId: string = "",
    topN: number = 100
  ): Promise<KOLAPIResponse> {
    // Check if we have cached data and it's still valid
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_DURATION) {
      return {
        data: this.cache.data,
        latency: this.cache.latency,
      };
    }

    // Fetch fresh data
    const response = await this.getTopKOLs(duration, topicId, topN);

    // Update cache
    this.cache = {
      data: response.data,
      timestamp: Date.now(),
      latency: response.latency || 0,
    };

    return response;
  }
}

export const kolService = new KOLService();
