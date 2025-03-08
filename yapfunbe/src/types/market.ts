import { Redis } from "ioredis";
import { PubSub } from "graphql-subscriptions";

export enum PositionType {
  LONG = "LONG",
  SHORT = "SHORT",
}

export enum PositionStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  LIQUIDATED = "LIQUIDATED",
}

export enum OrderType {
  LIMIT = "LIMIT",
  MARKET = "MARKET",
}

export enum OrderStatus {
  OPEN = "OPEN",
  FILLED = "FILLED",
  CANCELLED = "CANCELLED",
}

export enum CycleStatusEnum {
  NOT_STARTED = "NOT_STARTED",
  ACTIVE = "ACTIVE",
  ENDING = "ENDING",
  BUFFER = "BUFFER",
  ENDED = "ENDED",
}

export interface CrashedOutKOL {
  id: string;
  username?: string | null;
  marketAddress: string;
  crashedOutAt: string;
}

export interface CycleStatus {
  status: CycleStatusEnum;
  bufferEndTime?: string;
  globalExpiry?: string;
  isInBuffer: boolean;
  crashedOutKols?: CrashedOutKOL[];
}

export interface PricePoint {
  price: number;
  timestamp: string;
}

export interface Market {
  id: string;
  name: string;
  description?: string;
  totalVolume: number;
  totalPositions: number;
  currentPrice: number;
  priceHistory: PricePoint[];
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  marketId: string;
  trader: string;
  amount: number;
  entryPrice: number;
  type: PositionType;
  status: PositionStatus;
  pnl?: number;
  createdAt: string;
  closedAt?: string;
}

export interface Order {
  id: string;
  marketId: string;
  trader: string;
  amount: number;
  price: number;
  type: OrderType;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MarketDeployment {
  kolId: string;
  marketAddress: string;
  kolName: string;
  timestamp: string;
  mindshare: number;
  rank: string;
}

export interface MarketResolverContext {
  redis: Redis;
  pubsub: PubSub;
  user?: {
    id: string;
    address: string;
  };
}

// Resolver Types
export interface QueryResolvers {
  markets: (
    parent: unknown,
    args: unknown,
    context: MarketResolverContext
  ) => Promise<Market[]>;
  market: (
    parent: unknown,
    args: { id: string },
    context: MarketResolverContext
  ) => Promise<Market | null>;
  // positions and marketPositions resolvers have been removed as they are not used by the frontend
  orders: (
    parent: unknown,
    args: { trader: string },
    context: MarketResolverContext
  ) => Promise<Order[]>;
  marketOrders: (
    parent: unknown,
    args: { marketId: string },
    context: MarketResolverContext
  ) => Promise<Order[]>;
  cycleStatus: (
    parent: unknown,
    args: unknown,
    context: MarketResolverContext
  ) => Promise<CycleStatus | null>;
}

export interface MutationResolvers {
  createPosition: (
    parent: unknown,
    args: {
      input: {
        marketId: string;
        amount: number;
        leverage: number;
        type: PositionType;
      };
    },
    context: MarketResolverContext
  ) => Promise<Position>;
  closePosition: (
    parent: unknown,
    args: { positionId: string },
    context: MarketResolverContext
  ) => Promise<Position>;
  createOrder: (
    parent: unknown,
    args: {
      input: {
        marketId: string;
        amount: number;
        price: number;
        type: OrderType;
      };
    },
    context: MarketResolverContext
  ) => Promise<Order>;
  updateOrder: (
    parent: unknown,
    args: {
      input: {
        orderId: string;
        price: number;
      };
    },
    context: MarketResolverContext
  ) => Promise<Order>;
  cancelOrder: (
    parent: unknown,
    args: { orderId: string },
    context: MarketResolverContext
  ) => Promise<Order>;
}

export interface SubscriptionResolvers {
  marketPriceUpdated: {
    subscribe: (
      parent: unknown,
      args: { marketId: string },
      context: MarketResolverContext
    ) => AsyncIterator<unknown>;
  };
  positionUpdated: {
    subscribe: (
      parent: unknown,
      args: { trader: string },
      context: MarketResolverContext
    ) => AsyncIterator<unknown>;
  };
  orderUpdated: {
    subscribe: (
      parent: unknown,
      args: { trader: string },
      context: MarketResolverContext
    ) => AsyncIterator<unknown>;
  };
  marketDeployed: {
    subscribe: (
      parent: unknown,
      args: unknown,
      context: MarketResolverContext
    ) => AsyncIterator<unknown>;
  };
}
