import { createPublicClient, http, parseAbi } from "viem";
import { mainnet } from "viem/chains";
import {
  Market,
  Position,
  PositionType,
  PositionStatus,
} from "../types/market";

// Initialize Viem client
const client = createPublicClient({
  chain: mainnet,
  transport: http(),
});

// Example ABI for market interactions
const marketAbi = parseAbi([
  "event MarketCreated(uint256 indexed marketId, string name, string description)",
  "event PositionOpened(uint256 indexed marketId, address indexed trader, uint256 amount, uint256 entryPrice, uint8 positionType)",
  "event PositionClosed(uint256 indexed marketId, address indexed trader, uint256 pnl)",
  "event PriceUpdated(uint256 indexed marketId, uint256 price, uint256 timestamp)",
]);

export class ContractService {
  private readonly client: typeof client;

  constructor() {
    this.client = client;
  }

  // Watch for market events
  async watchMarketEvents(marketAddress: string) {
    return this.client.watchContractEvent({
      address: marketAddress as `0x${string}`,
      abi: marketAbi,
      eventName: "PriceUpdated",
      onLogs: (logs: any[]) => {
        // Handle price updates
        console.log("Price updated:", logs);
      },
    });
  }

  // Watch for position events
  async watchPositionEvents(marketAddress: string) {
    return this.client.watchContractEvent({
      address: marketAddress as `0x${string}`,
      abi: marketAbi,
      eventName: "PositionOpened",
      onLogs: (logs: any[]) => {
        // Handle new positions
        console.log("Position opened:", logs);
      },
    });
  }

  // Get market data from contract
  async getMarketData(marketAddress: string): Promise<Partial<Market>> {
    try {
      // Example: Fetch market data from contract
      // This would be replaced with actual contract calls
      return {
        id: marketAddress,
        name: "Example Market",
        totalVolume: 0,
        totalPositions: 0,
        currentPrice: 0,
        priceHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching market data:", error);
      throw error;
    }
  }

  // Get position data from contract
  async getPosition(
    marketAddress: string,
    trader: string
  ): Promise<Partial<Position>> {
    try {
      // Example: Fetch position data from contract
      // This would be replaced with actual contract calls
      return {
        id: `${marketAddress}-${trader}`,
        marketId: marketAddress,
        trader,
        amount: 0,
        entryPrice: 0,
        type: PositionType.LONG,
        status: PositionStatus.OPEN,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching position data:", error);
      throw error;
    }
  }

  // Calculate position PnL
  async calculatePnL(
    marketAddress: string,
    position: Partial<Position>
  ): Promise<number> {
    try {
      // Get current price from contract
      const marketData = await this.getMarketData(marketAddress);
      const currentPrice = marketData.currentPrice || 0;
      const entryPrice = position.entryPrice || 0;
      const amount = position.amount || 0;
      const isLong = position.type === PositionType.LONG;

      return isLong
        ? (currentPrice - entryPrice) * amount
        : (entryPrice - currentPrice) * amount;
    } catch (error) {
      console.error("Error calculating PnL:", error);
      throw error;
    }
  }
}

export const contractService = new ContractService();
