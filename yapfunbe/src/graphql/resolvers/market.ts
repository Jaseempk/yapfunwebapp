import { PubSub } from "graphql-subscriptions";
import { Market, Position, PricePoint } from "../../types/market";
import { contractService } from "../../services/contract";
import { subgraphService } from "../../services/subgraph";

const pubsub = new PubSub();

export const marketResolvers = {
  Query: {
    markets: async (): Promise<Market[]> => {
      try {
        return await subgraphService.getMarkets();
      } catch (error) {
        console.error("Error fetching markets:", error);
        return [];
      }
    },

    market: async (
      _parent: unknown,
      { id }: { id: string }
    ): Promise<Market | null> => {
      try {
        return await subgraphService.getMarket(id);
      } catch (error) {
        console.error(`Error fetching market ${id}:`, error);
        return null;
      }
    },

    positions: async (
      _parent: unknown,
      { trader }: { trader: string }
    ): Promise<Position[]> => {
      try {
        return await subgraphService.getPositions(trader);
      } catch (error) {
        console.error(`Error fetching positions for ${trader}:`, error);
        return [];
      }
    },

    marketPositions: async (
      _parent: unknown,
      { marketId }: { marketId: string }
    ): Promise<Position[]> => {
      try {
        return await subgraphService.getMarketPositions(marketId);
      } catch (error) {
        console.error(
          `Error fetching positions for market ${marketId}:`,
          error
        );
        return [];
      }
    },
  },

  Market: {
    currentPrice: async (parent: Market): Promise<number> => {
      try {
        const marketData = await contractService.getMarketData(parent.id);
        return marketData.currentPrice || parent.currentPrice;
      } catch (error) {
        console.error(
          `Error fetching current price for market ${parent.id}:`,
          error
        );
        return parent.currentPrice;
      }
    },
  },

  Position: {
    pnl: async (parent: Position): Promise<number | undefined> => {
      try {
        return await contractService.calculatePnL(parent.marketId, parent);
      } catch (error) {
        console.error(
          `Error calculating PnL for position ${parent.id}:`,
          error
        );
        return parent.pnl;
      }
    },
  },

  Subscription: {
    marketPriceUpdated: {
      subscribe: (_parent: unknown, { marketId }: { marketId: string }) => {
        // Start watching contract events when subscription is created
        contractService.watchMarketEvents(marketId).catch(console.error);
        return pubsub.asyncIterator([`MARKET_PRICE_UPDATED:${marketId}`]);
      },
    },

    positionUpdated: {
      subscribe: (_parent: unknown, { trader }: { trader: string }) => {
        return pubsub.asyncIterator([`POSITION_UPDATED:${trader}`]);
      },
    },
  },
};

// Helper functions for publishing updates
export const publishMarketPriceUpdate = async (
  marketId: string,
  pricePoint: PricePoint
) => {
  await pubsub.publish(`MARKET_PRICE_UPDATED:${marketId}`, {
    marketPriceUpdated: pricePoint,
  });
};

export const publishPositionUpdate = async (
  trader: string,
  position: Position
) => {
  await pubsub.publish(`POSITION_UPDATED:${trader}`, {
    positionUpdated: position,
  });
};
