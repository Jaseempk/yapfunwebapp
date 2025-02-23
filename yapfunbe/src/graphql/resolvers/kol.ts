import { kolService } from "../../services/kol";

export const kolResolvers = {
  Query: {
    topKOLs: async (
      _parent: unknown,
      {
        duration = "7d",
        topicId = "",
        topN = 100,
      }: { duration?: string; topicId?: string; topN?: number }
    ) => {
      try {
        const response = await kolService.getTopKOLsWithCache(
          duration,
          topicId,
          topN
        );

        // Transform the raw API response into our GraphQL schema format
        return {
          kols: response.data.data.map((kol: any) => ({
            address: kol.address,
            mindshare: parseFloat(kol.mindshare || "0"),
            rank: parseInt(kol.rank || "0"),
            volume: parseFloat(kol.volume || "0"),
            trades: parseInt(kol.trades || "0"),
            pnl: parseFloat(kol.pnl || "0"),
            followers: parseInt(kol.followers || "0"),
            following: parseInt(kol.following || "0"),
          })),
          latency: response.latency,
        };
      } catch (error) {
        console.error("Error in topKOLs resolver:", error);
        throw error;
      }
    },
  },
};
