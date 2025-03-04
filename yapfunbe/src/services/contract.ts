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

// Create a singleton provider instance
export const provider = new ethers.providers.JsonRpcProvider(
  process.env.RPC_URL ||
    "https://base-sepolia.g.alchemy.com/v2/txntl9XYKWyIkkmj1p0JcecUKxqt9327",
  "base-sepolia" // Network name
);

// Function to get current network gas prices
async function getNetworkGasPrices() {
  try {
    const feeData = await provider.getFeeData();
    return {
      maxFeePerGas: feeData.maxFeePerGas || DEFAULT_GAS_SETTINGS.maxFeePerGas,
      maxPriorityFeePerGas:
        feeData.maxPriorityFeePerGas ||
        DEFAULT_GAS_SETTINGS.maxPriorityFeePerGas,
      gasLimit: DEFAULT_GAS_SETTINGS.gasLimit,
    };
  } catch (error) {
    console.warn(
      "Error fetching network gas prices, using default settings:",
      error
    );
    return DEFAULT_GAS_SETTINGS;
  }
}

// Cache contract instances
const contractCache = new Map<string, ethers.Contract>();

// Helper to get or create contract instance with gas optimization
const getContract = (marketAddress: string): ethers.Contract => {
  if (!contractCache.has(marketAddress)) {
    const contract = new ethers.Contract(marketAddress, orderBookAbi, provider);

    // Add overrides for gas optimization
    const overridableContract = contract as ethers.Contract & {
      populateTransaction: typeof contract.populateTransaction & {
        defaultOverrides?: () => Promise<ethers.PayableOverrides>;
      };
    };

    // Set default transaction overrides
    overridableContract.populateTransaction.defaultOverrides = async () => {
      const gasPrices = await getNetworkGasPrices();
      return {
        maxFeePerGas: gasPrices.maxFeePerGas,
        maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas,
        gasLimit: gasPrices.gasLimit,
      };
    };

    contractCache.set(marketAddress, overridableContract);
  }
  return contractCache.get(marketAddress)!;
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

      // Add retry logic
      let retries = 3;
      while (retries > 0) {
        try {
          const contract = getContract(marketAddress);
          const overrides =
            (await contract.populateTransaction.defaultOverrides?.()) || {};
          const tx = await contract.populateTransaction.marketVolume();
          const volume = await contract.marketVolume({ ...overrides, ...tx });
          return Number(volume) / 1e6 || 0;
        } catch (error: any) {
          retries--;
          if (retries === 0) {
            throw error;
          }
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
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
      const contract = getContract(marketId);
      const overrides =
        (await contract.populateTransaction.defaultOverrides?.()) || {};

      const [volume, price] = await Promise.all([
        contract.marketVolume({ ...overrides }).catch(() => 0),
        contract._getOraclePrice({ ...overrides }).catch(() => 0),
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
      const contract = getContract(marketId);
      const overrides =
        (await contract.populateTransaction.defaultOverrides?.()) || {};
      const currentPrice = await contract
        ._getOraclePrice({ ...overrides })
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
