import {
  Market,
  Position,
  Order,
  PositionType,
  OrderType,
  PositionStatus,
  OrderStatus,
} from "../types/market";
import { ethers } from "ethers";
import { orderBookAbi } from "../abi/orderBook";
import { subgraphService } from "./subgraph";

// Gas price optimization settings (only needed for state-changing transactions)
const DEFAULT_GAS_SETTINGS = {
  maxPriorityFeePerGas: ethers.utils.parseUnits("0.001", "gwei"),
  maxFeePerGas: ethers.utils.parseUnits("0.1", "gwei"),
  gasLimit: 2000000,
};

// List of RPC URLs in order of preference
const RPC_URLS = [
  process.env.RPC_URL,
  "https://api.developer.coinbase.com/rpc/v1/base-sepolia/DBytHtVTEsZ9VhQE0Zx7WvomGHot4hTI",
].filter(Boolean) as string[];

// Create a singleton provider instance with better configuration
const network = {
  name: "base-sepolia",
  chainId: 84532,
};

// Provider configuration
const PROVIDER_CONFIG = {
  timeout: 10000, // 10 seconds
  throttleLimit: 1,
  maxRetries: 3,
  retryDelay: 1000, // 1 second base delay
  headers: {
    "Accept-Encoding": "gzip, deflate, br",
  },
};

// Initialize provider with first RPC URL
const connectionInfo = {
  url: RPC_URLS[0],
  timeout: PROVIDER_CONFIG.timeout,
  throttleLimit: PROVIDER_CONFIG.throttleLimit,
  headers: PROVIDER_CONFIG.headers,
};

export const provider = new ethers.providers.JsonRpcProvider(
  connectionInfo,
  network
);

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to test provider connection
async function testProvider(
  provider: ethers.providers.Provider
): Promise<boolean> {
  try {
    const networkTest = provider.getNetwork();
    const blockTest = provider.getBlockNumber();

    // Use Promise.race to implement timeout
    const timeoutPromise = delay(PROVIDER_CONFIG.timeout);
    const result = await Promise.race([
      Promise.all([networkTest, blockTest]),
      timeoutPromise.then(() =>
        Promise.reject(new Error("Provider test timeout"))
      ),
    ]);

    return Array.isArray(result); // If we got an array, the tests passed
  } catch (error) {
    console.warn("Provider test failed:", error);
    return false;
  }
}

// Function to get a working provider with improved error handling
async function getWorkingProvider(): Promise<ethers.providers.Provider> {
  let lastError: Error | null = null;

  // Try each RPC URL with retries
  for (const url of RPC_URLS) {
    for (let attempt = 1; attempt <= PROVIDER_CONFIG.maxRetries; attempt++) {
      try {
        console.log(
          `Attempting to connect to ${url} (attempt ${attempt}/${PROVIDER_CONFIG.maxRetries})`
        );

        const provider = new ethers.providers.JsonRpcProvider(
          {
            url,
            timeout: PROVIDER_CONFIG.timeout,
            throttleLimit: PROVIDER_CONFIG.throttleLimit,
            headers: PROVIDER_CONFIG.headers,
          },
          network
        );

        // Test the provider
        const isWorking = await testProvider(provider);
        if (isWorking) {
          console.log(`Successfully connected to ${url}`);
          return provider;
        }

        throw new Error("Provider test failed");
      } catch (error: any) {
        lastError = error;
        console.warn(
          `Failed to connect to ${url} (attempt ${attempt}/${PROVIDER_CONFIG.maxRetries}):`,
          error.message || error
        );

        // If this isn't the last attempt, wait before retrying
        if (attempt < PROVIDER_CONFIG.maxRetries) {
          const retryDelay =
            PROVIDER_CONFIG.retryDelay * Math.pow(2, attempt - 1);
          await delay(retryDelay);
        }
      }
    }
  }

  // If we get here, all providers failed
  throw new Error(
    `All RPC endpoints failed. Last error: ${
      lastError?.message || "Unknown error"
    }`
  );
}

// Cache successful provider connections
let cachedProvider: {
  provider: ethers.providers.Provider;
  timestamp: number;
} | null = null;
const PROVIDER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to get a provider with caching
async function getProvider(): Promise<ethers.providers.Provider> {
  const now = Date.now();

  // Return cached provider if it's still valid
  if (
    cachedProvider &&
    now - cachedProvider.timestamp < PROVIDER_CACHE_DURATION
  ) {
    try {
      // Verify the cached provider still works
      const isWorking = await testProvider(cachedProvider.provider);
      if (isWorking) {
        return cachedProvider.provider;
      }
    } catch (error) {
      console.warn("Cached provider failed, getting new provider");
    }
  }

  // Get a new working provider
  const newProvider = await getWorkingProvider();

  // Cache the new provider
  cachedProvider = {
    provider: newProvider,
    timestamp: now,
  };

  return newProvider;
}

// Cache contract instances with expiry
interface CachedContract {
  contract: ethers.Contract;
  timestamp: number;
}

const contractCache = new Map<string, CachedContract>();
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes

// Helper to get or create contract instance
const getContract = async (marketAddress: string): Promise<ethers.Contract> => {
  const now = Date.now();
  const cached = contractCache.get(marketAddress);

  // Return cached contract if it exists and hasn't expired
  if (cached && now - cached.timestamp < CACHE_EXPIRY) {
    return cached.contract;
  }

  // Get a working provider
  const workingProvider = await getProvider();
  const contract = new ethers.Contract(
    marketAddress,
    orderBookAbi,
    workingProvider
  );

  // Cache the new contract instance
  contractCache.set(marketAddress, {
    contract,
    timestamp: now,
  });

  return contract;
};

// Interface for OrderCreated event from subgraph
interface OrderCreatedEvent {
  _totalVolume: string;
  blockTimestamp: string;
}

// Helper function to fetch the latest OrderCreated event for a market
async function getLatestOrderCreatedEvent(
  marketAddress: string
): Promise<OrderCreatedEvent | null> {
  try {
    // We'll use the existing getMarketVolume method from subgraphService as a starting point
    // But we need to extend it to get the latest OrderCreated event with volume data

    // First try to get volume directly from subgraph service
    const volume = await subgraphService.getMarketVolume(marketAddress);
    if (volume > 0) {
      // If we got a valid volume, return it in the expected format
      return {
        _totalVolume: (volume * 1e6).toString(), // Convert back to raw format
        blockTimestamp: Math.floor(Date.now() / 1000).toString(), // Current timestamp
      };
    }

    // If direct method failed, return null to trigger fallback
    return null;
  } catch (error) {
    console.error(
      `[Subgraph] Error fetching volume for market ${marketAddress}:`,
      error
    );
    return null;
  }
}

export const contractService = {
  async getMarketVolume(marketAddress: string): Promise<number> {
    try {
      if (
        !marketAddress ||
        marketAddress === "0x0000000000000000000000000000000000000000"
      ) {
        return 0;
      }

      // First try to get volume from subgraph
      console.log(
        `[Market Service] Getting volume via subgraph for market: ${marketAddress}`
      );
      const latestEvent = await getLatestOrderCreatedEvent(marketAddress);

      // If we got a valid volume from subgraph, return it
      if (latestEvent !== null) {
        const volume = Number(latestEvent._totalVolume) / 1e6;
        console.log(`[Market Service] Found volume from subgraph: ${volume}`);
        return volume;
      }

      // If subgraph query failed or returned no results, fall back to RPC
      console.log(
        `[Market Service] Subgraph volume lookup failed, falling back to RPC for market: ${marketAddress}`
      );

      // Add retry logic with exponential backoff
      let retries = 3;
      while (retries > 0) {
        try {
          const contract = await getContract(marketAddress);
          // No gas parameters needed for view function
          const volume = await contract.marketVolume();
          return Number(volume) / 1e6 || 0;
        } catch (error: any) {
          retries--;
          if (retries === 0) {
            throw error;
          }
          // Exponential backoff
          const delay = 1000 * Math.pow(2, 3 - retries);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
      return 0;
    } catch (error) {
      console.error(
        `Error fetching volume for market ${marketAddress}:`,
        error
      );
      return 0;
    }
  },

  async getMarketData(marketId: string): Promise<Market> {
    try {
      const contract = await getContract(marketId);

      // Call view functions without gas parameters
      const [volume, price] = await Promise.all([
        this.getMarketVolume(marketId).catch(() => 0),
        contract._getOraclePrice().catch(() => 0),
      ]);

      return {
        id: marketId,
        name: `Market ${marketId.slice(0, 6)}`,
        totalVolume: Number(volume) / 1e6,
        totalPositions: 0,
        currentPrice: Number(price) / 1e18,
        priceHistory: [
          {
            price: Number(price) / 1e18,
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error fetching market data for ${marketId}:`, error);
      return {
        id: marketId,
        name: `Market ${marketId.slice(0, 6)}`,
        totalVolume: 0,
        totalPositions: 0,
        currentPrice: 0,
        priceHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },

  async getPosition(positionId: string): Promise<Position> {
    // Return mock data for now
    return {
      id: positionId,
      marketId: "1",
      trader: "0x123",
      amount: 100,
      entryPrice: 100,
      type: PositionType.LONG,
      status: PositionStatus.OPEN,
      pnl: 0,
      createdAt: new Date().toISOString(),
    };
  },

  async getOrders(trader: string): Promise<Order[]> {
    // Return mock data for now
    return [
      {
        id: "1",
        marketId: "1",
        trader,
        amount: 100,
        price: 100,
        type: OrderType.LIMIT,
        status: OrderStatus.OPEN,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  },

  async getMarketOrders(marketId: string): Promise<Order[]> {
    // Return mock data for now
    return [
      {
        id: "1",
        marketId,
        trader: "0x123",
        amount: 100,
        price: 100,
        type: OrderType.LIMIT,
        status: OrderStatus.OPEN,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  },

  async createPosition(
    address: string,
    marketId: string,
    amount: number,
    type: PositionType
  ): Promise<Position> {
    // Return mock data for now
    return {
      id: "1",
      marketId,
      trader: address,
      amount,
      entryPrice: 100,
      type,
      status: PositionStatus.OPEN,
      pnl: 0,
      createdAt: new Date().toISOString(),
    };
  },

  async closePosition(address: string, positionId: string): Promise<Position> {
    // Return mock data for now
    return {
      id: positionId,
      marketId: "1",
      trader: address,
      amount: 100,
      entryPrice: 100,
      type: PositionType.LONG,
      status: PositionStatus.CLOSED,
      pnl: 0,
      createdAt: new Date().toISOString(),
      closedAt: new Date().toISOString(),
    };
  },

  async createOrder(
    address: string,
    marketId: string,
    amount: number,
    price: number,
    type: OrderType
  ): Promise<Order> {
    // Return mock data for now
    const now = new Date().toISOString();
    return {
      id: "1",
      marketId,
      trader: address,
      amount,
      price,
      type,
      status: OrderStatus.OPEN,
      createdAt: now,
      updatedAt: now,
    };
  },

  async updateOrder(
    address: string,
    orderId: string,
    price: number
  ): Promise<Order> {
    // Return mock data for now
    return {
      id: orderId,
      marketId: "1",
      trader: address,
      amount: 100,
      price,
      type: OrderType.LIMIT,
      status: OrderStatus.OPEN,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async cancelOrder(address: string, orderId: string): Promise<Order> {
    // Return mock data for now
    return {
      id: orderId,
      marketId: "1",
      trader: address,
      amount: 100,
      price: 100,
      type: OrderType.LIMIT,
      status: OrderStatus.CANCELLED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async calculatePnL(marketId: string, position: Position): Promise<number> {
    try {
      const contract = await getContract(marketId);
      // No gas parameters needed for view function
      const currentPrice = await contract._getOraclePrice().catch(() => 0);

      const pnl =
        position.type === PositionType.LONG
          ? (Number(currentPrice) / 1e18 - position.entryPrice) *
            position.amount
          : (position.entryPrice - Number(currentPrice) / 1e18) *
            position.amount;
      return pnl;
    } catch (error) {
      console.error(
        `Error calculating PnL for position ${position.id}:`,
        error
      );
      return 0;
    }
  },

  async watchMarketEvents(marketId: string): Promise<void> {
    // TODO: Implement actual contract event watching
    console.log(`Watching market events for ${marketId}`);
  },

  // Validation helpers
  validateOwnership(trader: string, itemId: string): boolean {
    // TODO: Implement ownership validation using trader and itemId
    console.log(`Validating ownership for trader ${trader} and item ${itemId}`);
    return true;
  },

  validateMarketStatus(marketId: string): boolean {
    // TODO: Implement market status validation using marketId
    console.log(`Validating market status for ${marketId}`);
    return true;
  },

  validateOrderParameters(
    marketId: string,
    amount: number,
    price: number
  ): boolean {
    // TODO: Implement order parameter validation
    console.log(
      `Validating order parameters for market ${marketId}: amount=${amount}, price=${price}`
    );
    return true;
  },
};
