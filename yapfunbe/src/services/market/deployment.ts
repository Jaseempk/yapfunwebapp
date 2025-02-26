import { ethers } from "ethers";
import { yapOracleAbi, yapOracleCA } from "../../abi/yapOracle";
import { obFAbi, obfCA } from "../../abi/obFactory";
import { errorHandler } from "../error";
import { kolService } from "../kol";
import { redis } from "../../config/cache";
import { CACHE_PREFIX, CACHE_TTL } from "../../config/cache";
import { getWebSocketService } from "../websocket";
import { marketEvents, MarketEventType } from "./events";

export class MarketDeploymentService {
  private provider: ethers.providers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private yapOracle: ethers.Contract;
  private factory: ethers.Contract;

  constructor(privateKey: string) {
    // Initialize provider (you'll need to set RPC URL in .env)
    this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

    // Initialize signer
    this.signer = new ethers.Wallet(privateKey, this.provider);

    // Initialize contracts
    this.yapOracle = new ethers.Contract(
      yapOracleCA,
      yapOracleAbi,
      this.signer
    );
    this.factory = new ethers.Contract(obfCA, obFAbi, this.signer);
  }

  private getMarketCacheKey(kolId: string): string {
    return `${CACHE_PREFIX.MARKET}kol:${kolId}:market`;
  }

  async checkAndDeployMarkets(): Promise<void> {
    try {
      // Get top 100 KOLs
      const kols = await kolService.getKOLs(100);
      const wsService = getWebSocketService();

      for (const kol of kols) {
        try {
          // Check if market exists using factory contract
          const marketAddress = await this.factory.kolIdToMarket(kol.user_id);

          if (marketAddress === ethers.constants.AddressZero) {
            console.log(`Deploying market for KOL ${kol.user_id}`);

            // Deploy new market
            const tx = await this.factory.initialiseMarket(
              kol.user_id,
              this.yapOracle.address
            );
            const receipt = await tx.wait();

            try {
              // Get market address from event
              const event = receipt.events?.find(
                (e: any) => e.event === "NewMarketInitialisedAndWhitelisted"
              );

              if (event) {
                const marketAddress = event.args.marketAddy;

                // Cache the market address
                await redis.setex(
                  this.getMarketCacheKey(kol.user_id),
                  CACHE_TTL.MARKET,
                  marketAddress
                );

                // Emit market deployment event
                marketEvents.emit(MarketEventType.MARKET_DEPLOYED, {
                  kolId: kol.user_id,
                  marketAddress,
                  kolName: kol.name,
                  timestamp: Date.now(),
                });

                // Broadcast through websocket
                await wsService.broadcast("new_market_deployed", {
                  kolId: kol.user_id,
                  marketAddress,
                  kolName: kol.name,
                });

                console.log(
                  `Market deployed for KOL ${kol.user_id} at ${marketAddress}`
                );
              }
            } catch (error) {
              console.error(
                `Failed to process market deployment for KOL ${kol.user_id}:`,
                error
              );
              marketEvents.emit(MarketEventType.MARKET_DEPLOYMENT_FAILED, {
                kolId: kol.user_id,
                error: error instanceof Error ? error.message : "Unknown error",
                timestamp: Date.now(),
              });
              throw error;
            }
          } else {
            // Cache existing market address
            await redis.setex(
              this.getMarketCacheKey(kol.user_id),
              CACHE_TTL.MARKET,
              marketAddress
            );
          }
        } catch (error) {
          console.error(`Error processing KOL ${kol.user_id}:`, error);
          errorHandler.handle(error);
        }
      }
    } catch (error) {
      console.error("Error in checkAndDeployMarkets:", error);
      throw errorHandler.handle(error);
    }
  }

  async getMarketAddress(kolId: string): Promise<string | null> {
    try {
      // Try cache first
      const cachedAddress = await redis.get(this.getMarketCacheKey(kolId));
      if (cachedAddress) {
        return cachedAddress;
      }

      // Check contract
      const marketAddress = await this.factory.kolIdToMarket(kolId);
      if (marketAddress !== ethers.constants.AddressZero) {
        // Cache the result
        await redis.setex(
          this.getMarketCacheKey(kolId),
          CACHE_TTL.MARKET,
          marketAddress
        );
        return marketAddress;
      }

      return null;
    } catch (error) {
      console.error(`Error getting market address for KOL ${kolId}:`, error);
      throw errorHandler.handle(error);
    }
  }

  async setupEventListeners(): Promise<void> {
    try {
      // Listen for KOLDataUpdated events
      this.yapOracle.on("KOLDataUpdated", async (kolId) => {
        try {
          // Check and deploy market if needed
          const marketAddress = await this.getMarketAddress(kolId.toString());
          if (!marketAddress) {
            await this.checkAndDeployMarkets();
          }
        } catch (error) {
          console.error("Error handling KOLDataUpdated event:", error);
          errorHandler.handle(error);
        }
      });

      console.log("Market deployment event listeners setup complete");
    } catch (error) {
      console.error("Error setting up event listeners:", error);
      throw errorHandler.handle(error);
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.provider.getNetwork();
      return true;
    } catch (error) {
      console.error("Market deployment service health check failed:", error);
      return false;
    }
  }
}

// Export singleton instance
let marketDeploymentService: MarketDeploymentService | null = null;

export const initializeMarketDeploymentService = (
  privateKey: string
): MarketDeploymentService => {
  if (!marketDeploymentService) {
    marketDeploymentService = new MarketDeploymentService(privateKey);
  }
  return marketDeploymentService;
};

export const getMarketDeploymentService = (): MarketDeploymentService => {
  if (!marketDeploymentService) {
    throw new Error("Market deployment service not initialized");
  }
  return marketDeploymentService;
};
