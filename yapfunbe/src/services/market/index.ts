export { marketService } from "./market";
export { marketEventHandler } from "./events";
export { marketConfig } from "./config";
export { kolOrderbookService } from "./kolOrderbook";

// Types
export type { Market, Position, Order } from "../../types/market";
export {
  OrderType,
  OrderStatus,
  PositionType,
  PositionStatus,
} from "../../types/market";

// Market Service Types
export interface MarketServiceOptions {
  enableCache?: boolean;
  cacheTTL?: number;
  batchSize?: number;
}

export interface MarketServiceContext {
  userId?: string;
  address?: string;
  chainId?: number;
}

export interface MarketUpdateOptions {
  skipCache?: boolean;
  skipValidation?: boolean;
  skipNotification?: boolean;
}

export interface MarketQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filter?: Record<string, any>;
}

// Event Types
export interface MarketEventOptions {
  fromBlock?: number;
  toBlock?: number | "latest";
  batchSize?: number;
}

export interface MarketEventContext {
  marketId: string;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
}

// Config Types
export interface MarketConfigOptions {
  chainId?: number;
  rpcUrl?: string;
  factoryAddress?: string;
  escrowAddress?: string;
  subgraphUrl?: string;
}

export interface MarketValidationContext {
  marketId: string;
  trader: string;
  amount: number;
  leverage?: number;
  price?: number;
}
