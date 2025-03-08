import { PubSub } from "graphql-subscriptions";
import {
  Market,
  Position,
  PricePoint,
  Order,
  PositionType,
  OrderType,
  MarketResolverContext,
  QueryResolvers,
  MutationResolvers,
  SubscriptionResolvers,
  CycleStatus,
  CycleStatusEnum,
} from "../../types/market";
import { contractService } from "../../services/contract";
import { subgraphService } from "../../services/subgraph";
import { validationService } from "../../services/validation";
import { analyticsService } from "../../services/analytics";
import { notificationService } from "../../services/notification";
import { errorHandler } from "../../services/error";
import { marketEvents, MarketEventType } from "../../services/market/events";
import { schedulerService } from "../../services/scheduler";
import { CycleStatus as BackendCycleStatus } from "../../types/marketCycle";

const pubsub = new PubSub();

// Subscribe to market events
marketEvents.subscribe(MarketEventType.MARKET_DEPLOYED, (event) => {
  pubsub.publish("MARKET_DEPLOYED", {
    marketDeployed: event.data,
  });
});

marketEvents.subscribe(MarketEventType.MARKET_DEPLOYMENT_FAILED, (event) => {
  console.error("Market deployment failed:", event.data);
});

// Type guard for user context
const assertUser = (context: MarketResolverContext) => {
  if (!context.user?.id || !context.user?.address) {
    throw errorHandler.unauthorized();
  }
  return context.user;
};

export const marketResolvers: {
  Query: QueryResolvers;
  Mutation: MutationResolvers;
  Market: { currentPrice: (parent: Market) => Promise<number> };
  Position: { pnl: (parent: Position) => Promise<number | undefined> };
  Subscription: SubscriptionResolvers;
} = {
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
      _: unknown,
      { id }: { id: string }
    ): Promise<Market | null> => {
      try {
        validationService.validateMarket(id);
        return await subgraphService.getMarket(id);
      } catch (error) {
        console.error(`Error fetching market ${id}:`, error);
        throw errorHandler.handle(error);
      }
    },

    // positions and marketPositions resolvers have been removed as they are not used by the frontend
    // The frontend uses useUserOrders hook directly with the subgraph

    orders: async (
      _: unknown,
      { trader }: { trader: string },
      context: MarketResolverContext
    ): Promise<Order[]> => {
      try {
        assertUser(context);
        validationService.validateAddress(trader);
        return await contractService.getOrders(trader);
      } catch (error) {
        console.error(`Error fetching orders for ${trader}:`, error);
        throw errorHandler.handle(error);
      }
    },

    marketOrders: async (
      _: unknown,
      { marketId }: { marketId: string }
    ): Promise<Order[]> => {
      try {
        validationService.validateMarket(marketId);
        return await contractService.getMarketOrders(marketId);
      } catch (error) {
        console.error(`Error fetching orders for market ${marketId}:`, error);
        throw errorHandler.handle(error);
      }
    },

    cycleStatus: async (): Promise<CycleStatus | null> => {
      try {
        const cycleInfo = await schedulerService.getCycleInfo();
        if (!cycleInfo) return null;

        const {
          status,
          bufferEndTime,
          globalExpiry,
          isInBuffer,
          crashedOutKols,
        } = cycleInfo;

        // Map backend status to frontend enum
        let frontendStatus: CycleStatusEnum;
        switch (status) {
          case BackendCycleStatus.ACTIVE:
            frontendStatus = CycleStatusEnum.ACTIVE;
            break;
          case BackendCycleStatus.BUFFER:
            frontendStatus = CycleStatusEnum.BUFFER;
            break;
          case BackendCycleStatus.ENDING:
            frontendStatus = CycleStatusEnum.ENDING;
            break;
          case BackendCycleStatus.ENDED:
            frontendStatus = CycleStatusEnum.ENDED;
            break;
          default:
            frontendStatus = CycleStatusEnum.NOT_STARTED;
        }

        // Format crashed out KOLs for the response
        const formattedCrashedOutKols =
          crashedOutKols?.map((kol) => ({
            id: kol.id.toString(),
            username: kol.username || null,
            marketAddress: kol.marketAddress,
            crashedOutAt: kol.crashedOutAt
              ? kol.crashedOutAt.toString()
              : Date.now().toString(),
          })) || [];

        return {
          status: frontendStatus,
          bufferEndTime: bufferEndTime ? bufferEndTime.toString() : undefined,
          globalExpiry: globalExpiry ? globalExpiry.toString() : undefined,
          isInBuffer: isInBuffer || false,
          crashedOutKols: formattedCrashedOutKols,
        };
      } catch (error) {
        console.error("Error fetching cycle status:", error);
        return null;
      }
    },
  },

  Mutation: {
    createPosition: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          marketId: string;
          amount: number;
          leverage: number;
          type: PositionType;
        };
      },
      context: MarketResolverContext
    ): Promise<Position> => {
      try {
        const user = assertUser(context);

        validationService.validateSchema(
          input,
          validationService.createPositionSchema
        );

        // Calculate effective amount using leverage
        const effectiveAmount = input.amount * input.leverage;

        const position = await contractService.createPosition(
          user.address,
          input.marketId,
          effectiveAmount,
          input.type
        );

        await analyticsService.trackUserTrade(
          user.address,
          input.amount,
          0 // Initial PnL is 0
        );

        await notificationService.notifyTradeExecuted(
          user.address,
          position.marketId,
          input.amount,
          position.entryPrice,
          input.type
        );

        return position;
      } catch (error) {
        console.error("Error creating position:", error);
        throw errorHandler.handle(error);
      }
    },

    closePosition: async (
      _: unknown,
      { positionId }: { positionId: string },
      context: MarketResolverContext
    ): Promise<Position> => {
      try {
        const user = assertUser(context);

        const position = await contractService.closePosition(
          user.address,
          positionId
        );

        await analyticsService.trackUserTrade(
          user.address,
          position.amount,
          position.pnl || 0
        );

        await notificationService.notifyPositionClosed(
          user.address,
          position.marketId,
          position.pnl || 0
        );

        return position;
      } catch (error) {
        console.error("Error closing position:", error);
        throw errorHandler.handle(error);
      }
    },

    createOrder: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          marketId: string;
          amount: number;
          price: number;
          type: OrderType;
        };
      },
      context: MarketResolverContext
    ): Promise<Order> => {
      try {
        const user = assertUser(context);

        validationService.validateSchema(
          input,
          validationService.createOrderSchema
        );

        const order = await contractService.createOrder(
          user.address,
          input.marketId,
          input.amount,
          input.price,
          input.type
        );

        return order;
      } catch (error) {
        console.error("Error creating order:", error);
        throw errorHandler.handle(error);
      }
    },

    updateOrder: async (
      _: unknown,
      { input }: { input: { orderId: string; price: number } },
      context: MarketResolverContext
    ): Promise<Order> => {
      try {
        const user = assertUser(context);

        validationService.validateSchema(
          input,
          validationService.updateOrderSchema
        );

        const order = await contractService.updateOrder(
          user.address,
          input.orderId,
          input.price
        );

        return order;
      } catch (error) {
        console.error("Error updating order:", error);
        throw errorHandler.handle(error);
      }
    },

    cancelOrder: async (
      _: unknown,
      { orderId }: { orderId: string },
      context: MarketResolverContext
    ): Promise<Order> => {
      try {
        const user = assertUser(context);

        validationService.validateSchema(
          { orderId },
          validationService.cancelOrderSchema
        );

        const order = await contractService.cancelOrder(user.address, orderId);

        return order;
      } catch (error) {
        console.error("Error canceling order:", error);
        throw errorHandler.handle(error);
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
      subscribe: (_: unknown, { marketId }: { marketId: string }) => {
        contractService.watchMarketEvents(marketId).catch(console.error);
        return pubsub.asyncIterator([`MARKET_PRICE_UPDATED:${marketId}`]);
      },
    },

    positionUpdated: {
      subscribe: (
        _: unknown,
        { trader }: { trader: string },
        context: MarketResolverContext
      ) => {
        assertUser(context);
        return pubsub.asyncIterator([`POSITION_UPDATED:${trader}`]);
      },
    },

    orderUpdated: {
      subscribe: (
        _: unknown,
        { trader }: { trader: string },
        context: MarketResolverContext
      ) => {
        assertUser(context);
        return pubsub.asyncIterator([`ORDER_UPDATED:${trader}`]);
      },
    },

    marketDeployed: {
      subscribe: () => {
        return pubsub.asyncIterator(["MARKET_DEPLOYED"]);
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

export const publishOrderUpdate = async (trader: string, order: Order) => {
  await pubsub.publish(`ORDER_UPDATED:${trader}`, {
    orderUpdated: order,
  });
};
