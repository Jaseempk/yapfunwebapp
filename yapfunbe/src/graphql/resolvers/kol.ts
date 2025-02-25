import {
  KOL,
  KOLStats,
  KOLTrade,
  Duration,
  KOLQueryResponse,
} from "../../types/kol";
import { kolService } from "../../services/kol";
import { errorHandler } from "../../services/error";

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

        return {
          kols: response.data.data.map((kol) => ({
            address: "", // Will be populated from contract data
            mindshare: kol.mindshare,
            rank: parseInt(kol.rank),
            volume: 0, // Will be populated from contract data
            trades: 0, // Will be populated from contract data
            pnl: 0, // Will be populated from contract data
            followers: kol.follower_count,
            following: kol.following_count,
            user_id: kol.user_id,
            name: kol.name,
            username: kol.username,
            icon: kol.icon,
            bio: kol.bio,
            twitter_url: kol.twitter_user_url,
            last_7_day_mention_count: kol.last_7_day_mention_count,
          })),
          latency: response.latency,
        };
      } catch (error) {
        console.error("Error fetching top KOLs:", error);
        throw errorHandler.handle(error);
      }
    },
  },
};
