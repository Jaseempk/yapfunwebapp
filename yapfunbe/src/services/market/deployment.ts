import { ethers, ContractTransaction, BigNumber } from "ethers";
import { obFAbi, obfCA } from "../../abi/obFactory";
import { yapOracleCA } from "../../abi/yapOracle";
import { marketEvents, MarketEventType } from "./events";
import { kolService } from "../kol";
import { errorHandler } from "../error";
import { subgraphService } from "../subgraph";

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
        "https://api.developer.coinbase.com/rpc/v1/base-sepolia/DBytHtVTEsZ9VhQE0Zx7WvomGHot4hTI";
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

  private async getOptimizedGasPrice(): Promise<{
    maxFeePerGas: BigNumber;
    maxPriorityFeePerGas: BigNumber;
  }> {
    try {
      // Get the latest fee data
      const feeData = await this.provider.getFeeData();

      if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
        throw new Error("EIP-1559 fee data not available");
      }

      // Calculate a slightly lower max fee to optimize costs
      // Using 80% of the suggested maxFeePerGas
      const maxFeePerGas = feeData.maxFeePerGas.mul(80).div(100);

      // Use a lower priority fee as Base Sepolia is not congested
      // Start with 0.001 Gwei (1000000 wei)
      const minPriorityFee = ethers.utils.parseUnits("0.001", "gwei");
      const maxPriorityFeePerGas = BigNumber.from(minPriorityFee);

      console.log(`[Gas Optimization] Suggested fees:`, {
        maxFeePerGas: ethers.utils.formatUnits(maxFeePerGas, "gwei"),
        maxPriorityFeePerGas: ethers.utils.formatUnits(
          maxPriorityFeePerGas,
          "gwei"
        ),
      });

      return {
        maxFeePerGas,
        maxPriorityFeePerGas,
      };
    } catch (error) {
      console.error(
        "[Gas Optimization] Error getting optimized gas price:",
        error
      );
      // Fallback to very low gas prices if EIP-1559 is not available
      return {
        maxFeePerGas: ethers.utils.parseUnits("0.001", "gwei"),
        maxPriorityFeePerGas: ethers.utils.parseUnits("0.001", "gwei"),
      };
    }
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
      // First try using subgraph
      console.log(
        `[Market Service] Checking market for KOL ID via subgraph: ${kolId}`
      );
      const marketAddress = await subgraphService.checkMarketExists(kolId);
      if (marketAddress) {
        return true;
      }

      // If subgraph returns null (not found or error), fallback to RPC
      console.log(
        `[Market Service] Subgraph check failed, falling back to RPC for KOL ID: ${kolId}`
      );
      const kolIdBN = ethers.BigNumber.from(kolId);
      const rpcMarketAddress = await this.withRetry<string>(
        async () => await this.factoryContract.kolIdToMarket(kolIdBN)
      );

      return rpcMarketAddress !== "0x0000000000000000000000000000000000000000";
    } catch (error) {
      console.error("Error checking market existence:", error);
      return false;
    }
  }

  async getMarketAddress(kolId: string): Promise<string> {
    try {
      // First try using subgraph
      console.log(
        `[Market Service] Getting market address via subgraph for KOL ID: ${kolId}`
      );
      const marketAddress = await subgraphService.checkMarketExists(kolId);
      if (marketAddress) {
        return marketAddress;
      }

      // If subgraph returns null (not found or error), fallback to RPC
      console.log(
        `[Market Service] Subgraph lookup failed, falling back to RPC for KOL ID: ${kolId}`
      );
      const kolIdBN = ethers.BigNumber.from(kolId);
      const rpcMarketAddress = await this.withRetry<string>(
        async () => await this.factoryContract.kolIdToMarket(kolIdBN)
      );

      if (rpcMarketAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error(`No market found for KOL ${kolId}`);
      }
      return rpcMarketAddress;
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

      // Get optimized gas prices
      const { maxFeePerGas, maxPriorityFeePerGas } =
        await this.getOptimizedGasPrice();

      // Prepare transaction with optimized gas settings
      const tx = await this.withRetry<ContractTransaction>(
        async () =>
          await this.factoryContract.initialiseMarket(kolIdBN, yapOracleCA, {
            maxFeePerGas,
            maxPriorityFeePerGas,
          })
      );

      console.log(`[Market Service] Deploying market with transaction:`, {
        hash: tx.hash,
        maxFeePerGas: ethers.utils.formatUnits(maxFeePerGas, "gwei"),
        maxPriorityFeePerGas: ethers.utils.formatUnits(
          maxPriorityFeePerGas,
          "gwei"
        ),
      });

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
      console.log(`Gas used: ${receipt.gasUsed.toString()}`);
      console.log(
        `Effective gas price: ${ethers.utils.formatUnits(
          receipt.effectiveGasPrice,
          "gwei"
        )} Gwei`
      );

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
