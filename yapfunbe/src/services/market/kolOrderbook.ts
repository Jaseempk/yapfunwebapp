import { KaitoKOL } from "../../types/kol";
import { errorHandler } from "../error";
import { marketEvents, MarketEventType } from "./events";

interface KOLOrderbook {
  userId: string;
  longOrders: number;
  shortOrders: number;
  lastUpdateTime: number;
}

class KOLOrderbookService {
  private static instance: KOLOrderbookService;
  private orderbooks: Map<string, KOLOrderbook>;
  private checkInterval: NodeJS.Timeout | null;

  private constructor() {
    this.orderbooks = new Map();
    this.checkInterval = null;
  }

  public static getInstance(): KOLOrderbookService {
    if (!KOLOrderbookService.instance) {
      KOLOrderbookService.instance = new KOLOrderbookService();
    }
    return KOLOrderbookService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Start periodic checks
      this.checkInterval = setInterval(() => {
        this.checkOrderbooks().catch((error) => {
          console.error("Error checking orderbooks:", error);
        });
      }, 60000); // Check every minute

      console.log("KOL orderbook service initialized");
    } catch (error) {
      console.error("Error initializing KOL orderbook service:", error);
      throw errorHandler.handle(error);
    }
  }

  private async checkOrderbooks(): Promise<void> {
    try {
      const now = Date.now();
      const staleThreshold = 5 * 60 * 1000; // 5 minutes

      for (const [userId, orderbook] of this.orderbooks) {
        if (now - orderbook.lastUpdateTime > staleThreshold) {
          // Emit event for stale orderbook
          marketEvents.emit(MarketEventType.POSITION_UPDATE, {
            userId,
            status: "stale",
            lastUpdate: orderbook.lastUpdateTime,
          });
        }
      }
    } catch (error) {
      console.error("Error checking orderbooks:", error);
      throw errorHandler.handle(error);
    }
  }

  public async updateOrderbook(
    kol: KaitoKOL,
    longOrders: number,
    shortOrders: number
  ): Promise<void> {
    try {
      const orderbook: KOLOrderbook = {
        userId: kol.user_id,
        longOrders,
        shortOrders,
        lastUpdateTime: Date.now(),
      };

      this.orderbooks.set(kol.user_id, orderbook);

      // Emit update event
      marketEvents.emit(MarketEventType.POSITION_UPDATE, {
        userId: kol.user_id,
        longOrders,
        shortOrders,
        timestamp: orderbook.lastUpdateTime,
      });
    } catch (error) {
      console.error("Error updating orderbook:", error);
      throw errorHandler.handle(error);
    }
  }

  public async getOrderbook(userId: string): Promise<KOLOrderbook | null> {
    try {
      return this.orderbooks.get(userId) || null;
    } catch (error) {
      console.error("Error getting orderbook:", error);
      throw errorHandler.handle(error);
    }
  }

  public async cleanup(): Promise<void> {
    try {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
      this.orderbooks.clear();
    } catch (error) {
      console.error("Error cleaning up KOL orderbook service:", error);
      throw errorHandler.handle(error);
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      // Check if interval is running
      if (!this.checkInterval) {
        return false;
      }

      // Add test orderbook
      const testId = "test";
      await this.updateOrderbook(
        {
          user_id: testId,
          name: "Test KOL",
          username: "test",
          icon: "",
          bio: "",
          twitter_user_url: "",
          follower_count: 0,
          following_count: 0,
          mindshare: 0,
          rank: "0",
          created_at: new Date().toISOString(),
          last_7_day_standard_smart_engagement_count: 0,
          last_7_day_engagement_count: 0,
          last_7_day_mention_count: 0,
          last_7_sum_mention_percentage: 0,
          last_7_day_avg_llm_insightfulness_score_scaled: 0,
          last_7_day_avg_originality_score_scaled: 0,
          last_7_normalized_mention_score: 0,
          smart_following_count: 0,
          smart_follower_count: 0,
        },
        1,
        1
      );

      const testOrderbook = await this.getOrderbook(testId);
      await this.cleanup();

      return testOrderbook !== null;
    } catch (error) {
      console.error("KOL orderbook service health check failed:", error);
      return false;
    }
  }
}

export const kolOrderbookService = KOLOrderbookService.getInstance();
