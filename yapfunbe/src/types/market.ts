export enum PositionType {
  LONG = "LONG",
  SHORT = "SHORT",
}

export enum PositionStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  LIQUIDATED = "LIQUIDATED",
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

export interface MarketResolverContext {
  redis: Redis;
  pubsub: PubSub;
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
  positions: (
    parent: unknown,
    args: { trader: string },
    context: MarketResolverContext
  ) => Promise<Position[]>;
  marketPositions: (
    parent: unknown,
    args: { marketId: string },
    context: MarketResolverContext
  ) => Promise<Position[]>;
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
}

// Import these at the top of the file but TypeScript will complain about circular dependencies
// so we'll declare them here
declare class Redis {
  hgetall(key: string): Promise<Record<string, string>>;
  hget(key: string, field: string): Promise<string | null>;
  hset(key: string, field: string, value: string): Promise<number>;
  hdel(key: string, field: string): Promise<number>;
}

declare class PubSub {
  publish(triggerName: string, payload: any): Promise<void>;
  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T>;
}
