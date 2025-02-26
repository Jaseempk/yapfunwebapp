import { ethers } from "ethers";

interface MarketConfig {
  address: string;
  abi: ethers.ContractInterface;
}

class MarketConfigService {
  private marketConfigs: Map<string, MarketConfig> = new Map();

  constructor() {
    // Initialize with default market configs
    // These should be loaded from environment variables or a config file
    this.initializeMarketConfigs();
  }

  private initializeMarketConfigs() {
    // Example market ABI - replace with actual ABI
    const defaultAbi = [
      "event PriceUpdated(uint256 price, uint256 timestamp)",
      "event PositionOpened(string positionId, address trader, uint256 amount, int256 leverage, uint256 entryPrice)",
      "event PositionClosed(string positionId, int256 pnl)",
      "event PositionLiquidated(string positionId)",
      "event OrderCreated(string orderId, address trader, uint256 amount, uint256 price, uint8 orderType)",
      "event OrderFilled(string orderId, uint256 fillPrice)",
      "event OrderCancelled(string orderId)",
      // Add other necessary events and functions
    ];

    // Load market addresses from environment variables
    const markets = process.env.MARKET_ADDRESSES
      ? JSON.parse(process.env.MARKET_ADDRESSES)
      : {};

    // Initialize each market config
    Object.entries(markets).forEach(([marketId, address]) => {
      this.marketConfigs.set(marketId, {
        address: address as string,
        abi: defaultAbi,
      });
    });
  }

  getMarketAddress(marketId: string): string | undefined {
    return this.marketConfigs.get(marketId)?.address;
  }

  getMarketABI(): ethers.ContractInterface {
    // For now, return default ABI
    // In the future, could support different ABIs per market
    return [
      "event PriceUpdated(uint256 price, uint256 timestamp)",
      "event PositionOpened(string positionId, address trader, uint256 amount, int256 leverage, uint256 entryPrice)",
      "event PositionClosed(string positionId, int256 pnl)",
      "event PositionLiquidated(string positionId)",
      "event OrderCreated(string orderId, address trader, uint256 amount, uint256 price, uint8 orderType)",
      "event OrderFilled(string orderId, uint256 fillPrice)",
      "event OrderCancelled(string orderId)",
      // Add other necessary events and functions
    ];
  }

  addMarketConfig(marketId: string, config: MarketConfig): void {
    this.marketConfigs.set(marketId, config);
  }

  removeMarketConfig(marketId: string): void {
    this.marketConfigs.delete(marketId);
  }

  getMarketIds(): string[] {
    return Array.from(this.marketConfigs.keys());
  }

  // Health check
  healthCheck(): boolean {
    try {
      // Check if we have any market configs
      if (this.marketConfigs.size === 0) {
        console.warn("No market configs found");
        return false;
      }

      // Check if all markets have valid addresses
      for (const [marketId, config] of this.marketConfigs) {
        if (!ethers.utils.isAddress(config.address)) {
          console.warn(`Invalid address for market ${marketId}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Market config health check failed:", error);
      return false;
    }
  }
}

export const marketConfig = new MarketConfigService();
