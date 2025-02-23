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
} from "../../types/market";
import { contractService } from "../../services/contract";
import { subgraphService } from "../../services/subgraph";
import { validationService } from "../../services/validation";
import { authService } from "../../services/auth";
import { analyticsService } from "../../services/analytics";
import { notificationService } from "../../services/notification";
import { errorHandler } from "../../services/error";
import { rateLimiter } from "../../services/rateLimit";
import { cacheUtils, CACHE_TTL } from "../../config/cache";

const pubsub = new PubSub();

// Type guard for user context
const assertUser = (context: MarketResolverContext) => {
  if (!context.user?.id || !context.user?.address) {
    throw errorHandler.unauthorized();
  }
  return context.user;
};

// Resolver types
type ResolverFn<TArgs = any, TResult = any> = (
  parent: unknown,
  args: TArgs,
  context: MarketResolverContext
) => Promise<TResult>;

type FieldResolverFn<TParent, TResult> = (
  parent: TParent,
  args: unknown,
  context: MarketResolverContext
) => Promise<TResult>;

type SubscriptionResolverFn<TArgs = any> = (
  parent: unknown,
  args: TArgs,
  context: MarketResolverContext
) => AsyncIterator<unknown>;

// Middleware types
type Middleware<TArgs = any, TResult = any> = (
  next: ResolverFn<TArgs, TResult>
) => ResolverFn<TArgs, TResult>;

type FieldMiddleware<TParent, TResult> = (
  next: FieldResolverFn<TParent, TResult>
) => FieldResolverFn<TParent, TResult>;

type SubscriptionMiddleware<TArgs = any> = (
  next: SubscriptionResolverFn<TArgs>
) => SubscriptionResolverFn<TArgs>;

// Middleware composition helpers
const composeMiddleware =
  <TArgs, TResult>(middlewares: Middleware<TArgs, TResult>[]) =>
  (resolver: ResolverFn<TArgs, TResult>): ResolverFn<TArgs, TResult> => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      resolver
    );
  };

const composeFieldMiddleware =
  <TParent, TResult>(middlewares: FieldMiddleware<TParent, TResult>[]) =>
  (
    resolver: FieldResolverFn<TParent, TResult>
  ): FieldResolverFn<TParent, TResult> => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      resolver
    );
  };

const composeSubscriptionMiddleware =
  <TArgs>(middlewares: SubscriptionMiddleware<TArgs>[]) =>
  (resolver: SubscriptionResolverFn<TArgs>): SubscriptionResolverFn<TArgs> => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      resolver
    );
  };

// Rate limiting middleware
const withRateLimit =
  (type: string): Middleware =>
  (next) =>
  async (parent, args, context) => {
    const identifier = context.user?.id || context.user?.address || "anonymous";
    await rateLimiter.checkLimit(identifier, type);
    return next(parent, args, context);
  };

// Auth middleware
const withAuth: Middleware = (next) => async (parent, args, context) => {
  assertUser(context);
  return next(parent, args, context);
};

// Cache middleware
const withCache =
  (key: string, ttl: number = CACHE_TTL.MARKET): Middleware =>
  (next) =>
  async (parent, args, context) => {
    const cacheKey = `${key}:${JSON.stringify(args)}`;
    const cached = await context.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await next(parent, args, context);
    await context.redis.setex(cacheKey, ttl, JSON.stringify(result));
    return result;
  };

export const marketResolvers: {
  Query: QueryResolvers;
  Mutation: MutationResolvers;
  Market: { currentPrice: FieldResolverFn<Market, number> };
  Position: { pnl: FieldResolverFn<Position, number | undefined> };
  Subscription: SubscriptionResolvers;
} = {
  Query: {
    markets: composeMiddleware([withCache("markets", CACHE_TTL.MARKET)])(
      async (
        _: unknown,
        __: unknown,
        context: MarketResolverContext
      ): Promise<Market[]> => {
        try {
          return await subgraphService.getMarkets();
        } catch (error) {
          console.error("Error fetching markets:", error);
          return [];
        }
      }
    ),

    market: composeMiddleware([withCache("market", CACHE_TTL.MARKET)])(
      async (
        _: unknown,
        { id }: { id: string },
        context: MarketResolverContext
      ): Promise<Market | null> => {
        try {
          validationService.validateMarket(id);
          return await subgraphService.getMarket(id);
        } catch (error) {
          console.error(`Error fetching market ${id}:`, error);
          throw errorHandler.handle(error);
        }
      }
    ),

    positions: composeMiddleware([withRateLimit("query"), withAuth])(
      async (
        _: unknown,
        { trader }: { trader: string },
        context: MarketResolverContext
      ): Promise<Position[]> => {
        try {
          validationService.validateAddress(trader);
          return await subgraphService.getPositions(trader);
        } catch (error) {
          console.error(`Error fetching positions for ${trader}:`, error);
          throw errorHandler.handle(error);
        }
      }
    ),

    marketPositions: composeMiddleware([
      withCache("marketPositions", CACHE_TTL.MARKET),
    ])(
      async (
        _: unknown,
        { marketId }: { marketId: string },
        context: MarketResolverContext
      ): Promise<Position[]> => {
        try {
          validationService.validateMarket(marketId);
          return await subgraphService.getMarketPositions(marketId);
        } catch (error) {
          console.error(
            `Error fetching positions for market ${marketId}:`,
            error
          );
          throw errorHandler.handle(error);
        }
      }
    ),

    orders: composeMiddleware([withRateLimit("query"), withAuth])(
      async (
        _: unknown,
        { trader }: { trader: string },
        context: MarketResolverContext
      ): Promise<Order[]> => {
        try {
          validationService.validateAddress(trader);
          return await contractService.getOrders(trader);
        } catch (error) {
          console.error(`Error fetching orders for ${trader}:`, error);
          throw errorHandler.handle(error);
        }
      }
    ),

    marketOrders: composeMiddleware([
      withCache("marketOrders", CACHE_TTL.MARKET),
    ])(
      async (
        _: unknown,
        { marketId }: { marketId: string },
        context: MarketResolverContext
      ): Promise<Order[]> => {
        try {
          validationService.validateMarket(marketId);
          return await contractService.getMarketOrders(marketId);
        } catch (error) {
          console.error(`Error fetching orders for market ${marketId}:`, error);
          throw errorHandler.handle(error);
        }
      }
    ),
  },

  Mutation: {
    createPosition: composeMiddleware([withRateLimit("trading"), withAuth])(
      async (
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

          const position = await contractService.createPosition(
            user.address,
            input.marketId,
            input.amount,
            input.leverage,
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
      }
    ),

    closePosition: composeMiddleware([withRateLimit("trading"), withAuth])(
      async (
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
      }
    ),

    createOrder: composeMiddleware([withRateLimit("trading"), withAuth])(
      async (
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
      }
    ),

    updateOrder: composeMiddleware([withRateLimit("trading"), withAuth])(
      async (
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
      }
    ),

    cancelOrder: composeMiddleware([withRateLimit("trading"), withAuth])(
      async (
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

          const order = await contractService.cancelOrder(
            user.address,
            orderId
          );

          return order;
        } catch (error) {
          console.error("Error canceling order:", error);
          throw errorHandler.handle(error);
        }
      }
    ),
  },

  Market: {
    currentPrice: composeFieldMiddleware<Market, number>([
      withCache("marketPrice", CACHE_TTL.MARKET) as FieldMiddleware<
        Market,
        number
      >,
    ])(async (parent: Market): Promise<number> => {
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
    }),
  },

  Position: {
    pnl: composeFieldMiddleware<Position, number | undefined>([
      withCache("positionPnl", CACHE_TTL.POSITION) as FieldMiddleware<
        Position,
        number | undefined
      >,
    ])(async (parent: Position): Promise<number | undefined> => {
      try {
        return await contractService.calculatePnL(parent.marketId, parent);
      } catch (error) {
        console.error(
          `Error calculating PnL for position ${parent.id}:`,
          error
        );
        return parent.pnl;
      }
    }),
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
