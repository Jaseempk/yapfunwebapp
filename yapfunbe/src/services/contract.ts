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

// Gas price optimization settings
const DEFAULT_GAS_SETTINGS = {
  maxPriorityFeePerGas: ethers.utils.parseUnits("0.001", "gwei"), // 0.001 Gwei priority fee
  maxFeePerGas: ethers.utils.parseUnits("0.1", "gwei"), // 0.1 Gwei max fee
  gasLimit: 2000000, // 2M gas limit
};

// List of RPC URLs in order of preference
const RPC_URLS = [
  process.env.RPC_URL,
  "https://base-sepolia.g.alchemy.com/v2/txntl9XYKWyIkkmj1p0JcecUKxqt9327",
  "https://sepolia.base.org",
].filter(Boolean) as string[];

// Create a singleton provider instance with better configuration
const network = {
  name: "base-sepolia",
  chainId: 84532,
};

const connectionInfo = {
  url: RPC_URLS[0],
  headers: {
    "Accept-Encoding": "gzip, deflate, br",
  },
};

export const provider = new ethers.providers.JsonRpcProvider(
  connectionInfo,
  network
);

// Function to get a working provider
async function getWorkingProvider(): Promise<ethers.providers.Provider> {
  for (const url of RPC_URLS) {
    try {
      const tempProvider = new ethers.providers.JsonRpcProvider(
        { url, headers: { "Accept-Encoding": "gzip, deflate, br" } },
        network
      );
      // Test the provider with a simple call
      await tempProvider.getBlockNumber();
      return tempProvider;
    } catch (error) {
      console.warn(`Failed to connect to ${url}:`, error);
    }
  }
  throw new Error("All RPC endpoints failed");
}

// Function to get current network gas prices with better fallbacks
async function getNetworkGasPrices() {
  try {
    // Try with the main provider first
    try {
      const feeData = await provider.getFeeData();
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        return {
          maxFeePerGas: feeData.maxFeePerGas,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
          gasLimit: DEFAULT_GAS_SETTINGS.gasLimit,
        };
      }
    } catch (mainError) {
      console.warn("Error with main provider, trying fallbacks:", mainError);
    }

    // Try with fallback providers
    try {
      const workingProvider = await getWorkingProvider();
      const feeData = await workingProvider.getFeeData();
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        return {
          maxFeePerGas: feeData.maxFeePerGas,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
          gasLimit: DEFAULT_GAS_SETTINGS.gasLimit,
        };
      }
    } catch (fallbackError) {
      console.warn("Error with fallback providers:", fallbackError);
    }

    // If all else fails, use hardcoded values based on recent network conditions
    console.warn("Using hardcoded gas settings as last resort");
    return DEFAULT_GAS_SETTINGS;
  } catch (error) {
    console.warn(
      "Error fetching network gas prices, using default settings:",
      error
    );
    return DEFAULT_GAS_SETTINGS;
  }
}

// Cache contract instances with expiry
interface CachedContract {
  contract: ethers.Contract;
  timestamp: number;
}

const contractCache = new Map<string, CachedContract>();
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes

// Helper to get or create contract instance with gas optimization
const getContract = async (marketAddress: string): Promise<ethers.Contract> => {
  const now = Date.now();
  const cached = contractCache.get(marketAddress);

  // Return cached contract if it exists and hasn't expired
  if (cached && now - cached.timestamp < CACHE_EXPIRY) {
    return cached.contract;
  }

  // Get a working provider
  const workingProvider = await getWorkingProvider();
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

export const contractService = {
  async getMarketVolume(marketAddress: string): Promise<number> {
    try {
      if (
        !marketAddress ||
        marketAddress === "0x0000000000000000000000000000000000000000"
      ) {
        return 0;
      }

      // Add retry logic with exponential backoff
      let retries = 3;
      while (retries > 0) {
        try {
          const contract = await getContract(marketAddress);
          const gasPrices = await getNetworkGasPrices();

          // Call the function with gas settings directly
          const volume = await contract.marketVolume({
            maxFeePerGas: gasPrices.maxFeePerGas,
            maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas,
            gasLimit: gasPrices.gasLimit,
          });

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
      const gasPrices = await getNetworkGasPrices();

      // Use gas settings directly without mixing with transaction data
      const [volume, price] = await Promise.all([
        contract
          .marketVolume({
            maxFeePerGas: gasPrices.maxFeePerGas,
            maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas,
            gasLimit: gasPrices.gasLimit,
          })
          .catch(() => 0),
        contract
          ._getOraclePrice({
            maxFeePerGas: gasPrices.maxFeePerGas,
            maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas,
            gasLimit: gasPrices.gasLimit,
          })
          .catch(() => 0),
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
      const gasPrices = await getNetworkGasPrices();

      // Use gas settings directly
      const currentPrice = await contract
        ._getOraclePrice({
          maxFeePerGas: gasPrices.maxFeePerGas,
          maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas,
          gasLimit: gasPrices.gasLimit,
        })
        .catch(() => 0);

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
