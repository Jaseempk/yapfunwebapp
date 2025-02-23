import { redis } from "../../config/cache";
import { CACHE_PREFIX, CACHE_TTL } from "../../config/cache";
import { errorHandler } from "../error";

interface MarketConfig {
  address: string;
  name: string;
  description?: string;
  minAmount: number;
  maxAmount: number;
  minLeverage: number;
  maxLeverage: number;
  liquidationThreshold: number;
  tradingFee: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NetworkConfig {
  chainId: number;
  rpcUrl: string;
  factoryAddress: string;
  escrowAddress: string;
  subgraphUrl: string;
}

export class MarketConfigService {
  private readonly networkConfig: NetworkConfig = {
    chainId: parseInt(process.env.CHAIN_ID || "1"),
    rpcUrl: process.env.RPC_URL || "http://localhost:8545",
    factoryAddress: process.env.FACTORY_ADDRESS || "",
    escrowAddress: process.env.ESCROW_ADDRESS || "",
    subgraphUrl: process.env.SUBGRAPH_URL || "",
  };

  // Market configuration
  async getMarketConfig(marketId: string): Promise<MarketConfig | null> {
    try {
      // Try cache first
      const cachedConfig = await redis.get(
        `${CACHE_PREFIX.MARKET}${marketId}:config`
      );
      if (cachedConfig) {
        return JSON.parse(cachedConfig);
      }

      // Fetch from contract/subgraph
      // For now, return null as this needs to be implemented
      return null;
    } catch (error) {
      throw errorHandler.handle(error);
    }
  }

  async setMarketConfig(
    marketId: string,
    config: Partial<MarketConfig>
  ): Promise<void> {
    try {
      const existingConfig = await this.getMarketConfig(marketId);
      const now = new Date().toISOString();

      const updatedConfig: MarketConfig = {
        ...existingConfig,
        ...config,
        updatedAt: now,
        createdAt: existingConfig?.createdAt || now,
      } as MarketConfig;

      await redis.setex(
        `${CACHE_PREFIX.MARKET}${marketId}:config`,
        CACHE_TTL.MARKET,
        JSON.stringify(updatedConfig)
      );
    } catch (error) {
      throw errorHandler.handle(error);
    }
  }

  // Network configuration
  getNetworkConfig(): NetworkConfig {
    return this.networkConfig;
  }

  // Market validation
  async validateMarketConfig(marketId: string): Promise<boolean> {
    try {
      const config = await this.getMarketConfig(marketId);
      if (!config) {
        throw errorHandler.notFound(
          `Market ${marketId} configuration not found`
        );
      }

      if (!config.enabled) {
        throw errorHandler.badRequest(`Market ${marketId} is disabled`);
      }

      return true;
    } catch (error) {
      throw errorHandler.handle(error);
    }
  }

  // Trading parameter validation
  async validateTradeAmount(
    marketId: string,
    amount: number
  ): Promise<boolean> {
    try {
      const config = await this.getMarketConfig(marketId);
      if (!config) {
        throw errorHandler.notFound(
          `Market ${marketId} configuration not found`
        );
      }

      if (amount < config.minAmount) {
        throw errorHandler.badRequest(
          `Amount ${amount} is below minimum ${config.minAmount}`
        );
      }

      if (amount > config.maxAmount) {
        throw errorHandler.badRequest(
          `Amount ${amount} is above maximum ${config.maxAmount}`
        );
      }

      return true;
    } catch (error) {
      throw errorHandler.handle(error);
    }
  }

  async validateLeverage(marketId: string, leverage: number): Promise<boolean> {
    try {
      const config = await this.getMarketConfig(marketId);
      if (!config) {
        throw errorHandler.notFound(
          `Market ${marketId} configuration not found`
        );
      }

      if (leverage < config.minLeverage) {
        throw errorHandler.badRequest(
          `Leverage ${leverage}x is below minimum ${config.minLeverage}x`
        );
      }

      if (leverage > config.maxLeverage) {
        throw errorHandler.badRequest(
          `Leverage ${leverage}x is above maximum ${config.maxLeverage}x`
        );
      }

      return true;
    } catch (error) {
      throw errorHandler.handle(error);
    }
  }

  // Fee calculation
  async calculateTradingFee(marketId: string, amount: number): Promise<number> {
    try {
      const config = await this.getMarketConfig(marketId);
      if (!config) {
        throw errorHandler.notFound(
          `Market ${marketId} configuration not found`
        );
      }

      return amount * config.tradingFee;
    } catch (error) {
      throw errorHandler.handle(error);
    }
  }

  // Liquidation check
  async checkLiquidationThreshold(
    marketId: string,
    pnlPercentage: number
  ): Promise<boolean> {
    try {
      const config = await this.getMarketConfig(marketId);
      if (!config) {
        throw errorHandler.notFound(
          `Market ${marketId} configuration not found`
        );
      }

      return Math.abs(pnlPercentage) >= config.liquidationThreshold;
    } catch (error) {
      throw errorHandler.handle(error);
    }
  }

  // Cleanup
  async clearMarketConfig(marketId: string): Promise<void> {
    try {
      await redis.del(`${CACHE_PREFIX.MARKET}${marketId}:config`);
    } catch (error) {
      throw errorHandler.handle(error);
    }
  }
}

export const marketConfigService = new MarketConfigService();
