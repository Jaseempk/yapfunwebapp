import { ethers, ContractTransaction, BigNumber } from "ethers";
import { obFAbi, obfCA } from "../../abi/obFactory";
import { yapOracleCA } from "../../abi/yapOracle";
import { marketEvents, MarketEventType } from "./events";
import { kolService } from "../kol";
import { errorHandler } from "../error";

type RetryableOperation<T> = () => Promise<T>;

export class MarketDeploymentService {
  private provider: ethers.providers.Provider;
  private signer: ethers.Wallet;
  private factoryContract: ethers.Contract;
  private static instance: MarketDeploymentService;
  private retryCount = 3;
  private retryDelay = 1000; // 1 second

  static initialize(privateKey: string): MarketDeploymentService {
    if (!MarketDeploymentService.instance) {
      const rpcUrl =
        process.env.RPC_URL ||
        "https://base-sepolia.g.alchemy.com/v2/txntl9XYKWyIkkmj1p0JcecUKxqt9327";
      const provider = new ethers.providers.JsonRpcProvider({
        url: rpcUrl,
        timeout: 30000, // 30 seconds
        throttleLimit: 1,
      });
      const signer = new ethers.Wallet(privateKey, provider);
      MarketDeploymentService.instance = new MarketDeploymentService(
        provider,
        signer
      );
    }
    return MarketDeploymentService.instance;
  }

  static getInstance(): MarketDeploymentService {
    if (!MarketDeploymentService.instance) {
      throw new Error("MarketDeploymentService not initialized");
    }
    return MarketDeploymentService.instance;
  }

  private constructor(
    provider: ethers.providers.Provider,
    signer: ethers.Wallet
  ) {
    this.provider = provider;
    this.signer = signer;
    this.factoryContract = new ethers.Contract(obfCA, obFAbi, this.signer);
  }

  private async withRetry<T>(operation: RetryableOperation<T>): Promise<T> {
    let lastError: any;
    for (let i = 0; i < this.retryCount; i++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        if (error.code === "NETWORK_ERROR" || error.code === "SERVER_ERROR") {
          console.log(`Retry attempt ${i + 1} of ${this.retryCount}`);
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  async checkMarketExists(kolId: string): Promise<boolean> {
    try {
      const kolIdBN = ethers.BigNumber.from(kolId);
      console.log(
        `[Market Service] Checking market for KOL ID (BigNumber): ${kolIdBN.toString()}`
      );

      const marketAddress = await this.withRetry<string>(
        async () => await this.factoryContract.kolIdToMarket(kolIdBN)
      );

      return marketAddress !== "0x0000000000000000000000000000000000000000";
    } catch (error) {
      console.error("Error checking market existence:", error);
      return false; // Return false instead of throwing to handle gracefully
    }
  }

  async getMarketAddress(kolId: string): Promise<string> {
    try {
      const kolIdBN = ethers.BigNumber.from(kolId);
      console.log(
        `[Market Service] Getting market for KOL ID (BigNumber): ${kolIdBN.toString()}`
      );

      const marketAddress = await this.withRetry<string>(
        async () => await this.factoryContract.kolIdToMarket(kolIdBN)
      );

      if (marketAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error(`No market found for KOL ${kolId}`);
      }
      return marketAddress;
    } catch (error) {
      console.error("Error getting market address:", error);
      throw errorHandler.handle(error);
    }
  }

  async deployMarket(kolId: string): Promise<string> {
    try {
      // Check if market already exists
      const exists = await this.checkMarketExists(kolId);
      if (exists) {
        throw new Error(`Market already exists for KOL ${kolId}`);
      }

      // Convert kolId to BigNumber and deploy new market with Oracle address
      const kolIdBN = ethers.BigNumber.from(kolId);
      console.log(
        `[Market Service] Deploying market for KOL ID (BigNumber): ${kolIdBN.toString()}`
      );

      const tx = await this.withRetry<ContractTransaction>(
        async () =>
          await this.factoryContract.initialiseMarket(kolIdBN, yapOracleCA)
      );

      console.log(`[Market Service] Waiting for transaction: ${tx.hash}`);
      const receipt = await tx.wait();

      // Get the market address from the event logs
      const event = receipt.events?.find(
        (e) => e.event === "NewMarketInitialisedAndWhitelisted"
      );
      if (!event) {
        throw new Error("Market creation event not found");
      }

      const marketAddress = event.args?.marketAddy;
      if (!marketAddress) {
        throw new Error("Market address not found in event");
      }

      console.log(`Market deployed for KOL ${kolId} at ${marketAddress}`);

      // Get KOL details for the event
      const kol = await kolService.getKOL(kolId);

      // Emit market deployed event
      marketEvents.emit(MarketEventType.MARKET_DEPLOYED, {
        kolId,
        marketAddress,
        kolName: kol?.name || kolId,
        timestamp: new Date().toISOString(),
        mindshare: kol?.mindshare || 0,
        rank: kol?.rank || "0",
      });

      return marketAddress;
    } catch (error) {
      console.error("Error deploying market:", error);
      marketEvents.emit(MarketEventType.MARKET_DEPLOYMENT_FAILED, {
        kolId,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: Date.now(),
      });
      throw errorHandler.handle(error);
    }
  }

  async deployMissingMarkets(kolIds: string[]): Promise<string[]> {
    const deployedMarkets: string[] = [];
    const failedDeployments: string[] = [];

    for (const kolId of kolIds) {
      try {
        const exists = await this.checkMarketExists(kolId);
        if (!exists) {
          const marketAddress = await this.deployMarket(kolId);
          deployedMarkets.push(marketAddress);
        }
      } catch (error) {
        console.error(`Error deploying market for KOL ${kolId}:`, error);
        failedDeployments.push(kolId);
        marketEvents.emit(MarketEventType.MARKET_DEPLOYMENT_FAILED, {
          kolId,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now(),
        });
      }
    }

    if (failedDeployments.length > 0) {
      console.log(
        `Failed to deploy markets for KOLs: ${failedDeployments.join(", ")}`
      );
    }

    return deployedMarkets;
  }

  setupEventListeners(callback?: (event: any) => void): void {
    const defaultCallback = (event: any) => {
      console.log("Market initialised:", event);
    };
    this.factoryContract.on(
      "NewMarketInitialisedAndWhitelisted",
      callback || defaultCallback
    );
  }

  async checkAndDeployMarkets(kolIds?: string[]): Promise<void> {
    try {
      if (!kolIds || kolIds.length === 0) {
        console.log("No KOL IDs provided for market deployment check");
        return;
      }
      await this.deployMissingMarkets(kolIds);
    } catch (error) {
      console.error("Error in checkAndDeployMarkets:", error);
      throw errorHandler.handle(error);
    }
  }
}

export const initializeMarketDeploymentService =
  MarketDeploymentService.initialize;
export const getMarketDeploymentService = MarketDeploymentService.getInstance;
