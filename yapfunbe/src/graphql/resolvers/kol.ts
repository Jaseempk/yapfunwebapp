import {
  KOL,
  KOLStats,
  KOLTrade,
  Duration,
  KOLQueryResponse,
} from "../../types/kol";
import { kolService } from "../../services/kol";
import { errorHandler } from "../../services/error";
import { marketEvents, MarketEventType } from "../../services/market/events";
import { getWebSocketService } from "../../services/websocket";

export const kolResolvers = {
  Query: {
    kols: async (
      _: unknown,
      args: { limit?: number; offset?: number }
    ): Promise<KOL[]> => {
      try {
        return await kolService.getKOLs(args.limit, args.offset);
      } catch (error) {
        console.error("Error fetching KOLs:", error);
        throw errorHandler.handle(error);
      }
    },

    kol: async (_: unknown, { id }: { id: string }): Promise<KOL> => {
      try {
        const kol = await kolService.getKOL(id);
        if (!kol) {
          throw new Error(`KOL not found with id ${id}`);
        }
        return kol;
      } catch (error) {
        console.error(`Error fetching KOL ${id}:`, error);
        throw errorHandler.handle(error);
      }
    },

    kolStats: async (_: unknown, { id }: { id: string }): Promise<KOLStats> => {
      try {
        return await kolService.getKOLStats(id);
      } catch (error) {
        console.error(`Error fetching stats for KOL ${id}:`, error);
        throw errorHandler.handle(error);
      }
    },

    kolTrades: async (
      _: unknown,
      { id, limit, offset }: { id: string; limit?: number; offset?: number }
    ): Promise<KOLTrade[]> => {
      try {
        return await kolService.getKOLTrades(id, limit, offset);
      } catch (error) {
        console.error(`Error fetching trades for KOL ${id}:`, error);
        throw errorHandler.handle(error);
      }
    },

    topKOLs: async (
      _: unknown,
      {
        duration = Duration.SEVEN_DAYS,
        topicId = "",
        topN = 100,
      }: {
        duration?: Duration;
        topicId?: string;
        topN?: number;
      }
    ): Promise<KOLQueryResponse> => {
      try {
        const response = await kolService.getTopKOLsWithCache(
          duration,
          topicId,
          topN
        );

        if (!response?.data?.data) {
          throw new Error("Invalid response format from KOL service");
        }

        // Set a reasonable timeout for blockchain operations
        const BLOCKCHAIN_TIMEOUT = 5000; // 5 seconds

        // Transform and return data with timeout protection
        const kols = await Promise.all(
          response.data.data.map(async (kol) => {
            try {
              // Create a promise that resolves with the transformed KOL data
              const transformPromise = kolService.transformKaitoKOL(kol);
              
              // Create a timeout promise
              const timeoutPromise = new Promise<any>((resolve) => {
                setTimeout(() => {
                  console.warn(`[KOL Service] Timeout for KOL ${kol.user_id} transformation`);
                  // Return fallback data with default values
                  resolve({
                    address: "",
                    marketAddress: "",
                    mindshare: Number(kol.mindshare || 0),
                    rank: kol.rank || "0",
                    // Default values for blockchain data
                    volume: 0,
                    trades: 0,
                    pnl: 0,
                    followers: Number(kol.follower_count || 0),
                    following: Number(kol.following_count || 0),
                    user_id: kol.user_id,
                    name: kol.name || kol.username || kol.user_id,
                    username: kol.username || "",
                    icon: kol.icon || "",
                    bio: kol.bio || "",
                    twitter_url: kol.twitter_user_url || "",
                    last_7_day_mention_count: Number(
                      kol.last_7_day_mention_count || 0
                    ),
                  });
                }, BLOCKCHAIN_TIMEOUT);
              });
              
              // Race the transform promise against the timeout
              return Promise.race([transformPromise, timeoutPromise]);
            } catch (error) {
              console.error(`Error transforming KOL ${kol.user_id}:`, error);
              return {
                address: "",
                marketAddress: "",
                mindshare: Number(kol.mindshare || 0),
                rank: kol.rank || "0",
                // Default values for blockchain data
                volume: 0,
                trades: 0,
                pnl: 0,
                followers: Number(kol.follower_count || 0),
                following: Number(kol.following_count || 0),
                user_id: kol.user_id,
                name: kol.name || kol.username || kol.user_id,
                username: kol.username || "",
                icon: kol.icon || "",
                bio: kol.bio || "",
                twitter_url: kol.twitter_user_url || "",
                last_7_day_mention_count: Number(
                  kol.last_7_day_mention_count || 0
                ),
              };
            }
          })
        );

        return {
          kols,
          latency: response.latency,
        };
      } catch (error) {
        console.error("Error fetching top KOLs:", error);
        throw errorHandler.handle(error);
      }
    },
  },

  Subscription: {
    kolMarketDeployed: {
      subscribe: (_: unknown, __: unknown, { pubsub }: { pubsub: any }) => {
        const wsService = getWebSocketService();
        marketEvents.subscribe(MarketEventType.MARKET_DEPLOYED, (event) => {
          wsService.broadcast("kol:market_deployed", event.data);
          pubsub.publish("KOL_MARKET_DEPLOYED", {
            kolMarketDeployed: event.data,
          });
        });
        return pubsub.asyncIterator(["KOL_MARKET_DEPLOYED"]);
      },
    },
  },
};
