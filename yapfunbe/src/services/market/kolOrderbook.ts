import { kolService } from "../kol";
import { contractService } from "../contract";
import { redis } from "../../config/cache";
import { CACHE_PREFIX } from "../../config/cache";
import { errorHandler } from "../error";
import { ethers } from "ethers";
import { createPublicClient, http, createWalletClient } from "viem";

export class KOLOrderbookService {
  private readonly FACTORY_ADDRESS = process.env.ORDERBOOK_FACTORY_ADDRESS;
  private readonly ORACLE_ADDRESS = process.env.ORACLE_ADDRESS;
  private readonly ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
  private checkInterval?: NodeJS.Timeout;

  // Cache key for tracking KOLs with deployed orderbooks
  private getDeployedKOLsKey(): string {
    return `${CACHE_PREFIX.MARKET}deployed_kols`;
  }

  // Check if a KOL already has an orderbook
  private async hasOrderbook(kolAddress: string): Promise<boolean> {
    try {
      const deployedKOLs = await redis.smembers(this.getDeployedKOLsKey());
      return deployedKOLs.includes(kolAddress);
    } catch (error) {
      console.error("Error checking KOL orderbook status:", error);
      return false;
    }
  }

  // Mark a KOL as having an orderbook
  private async markKOLAsDeployed(kolAddress: string): Promise<void> {
    try {
      await redis.sadd(this.getDeployedKOLsKey(), kolAddress);
    } catch (error) {
      console.error("Error marking KOL as deployed:", error);
      throw errorHandler.handle(error);
    }
  }

  // Deploy orderbook for a KOL
  private async deployOrderbook(kolAddress: string): Promise<string> {
    if (
      !this.FACTORY_ADDRESS ||
      !this.ORACLE_ADDRESS ||
      !this.ADMIN_PRIVATE_KEY
    ) {
      throw new Error("Missing required environment variables");
    }

    try {
      // Create wallet client for signing transactions
      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      const wallet = new ethers.Wallet(this.ADMIN_PRIVATE_KEY, provider);

      // Create factory contract instance
      const factoryContract = new ethers.Contract(
        this.FACTORY_ADDRESS,
        [
          "function initialiseMarket(uint256 kolId, address _oracle) external returns (address)",
        ],
        wallet
      );

      // Convert address to numeric ID for the contract
      const kolId = BigInt(kolAddress);

      // Deploy orderbook
      const tx = await factoryContract.initialiseMarket(
        kolId,
        this.ORACLE_ADDRESS
      );
      const receipt = await tx.wait();

      // Get deployed orderbook address from event logs
      const event = receipt.logs.find(
        (log: any) => log.eventName === "NewMarketInitialisedAndWhitelisted"
      );

      if (!event) {
        throw new Error("Failed to get deployed orderbook address");
      }

      const [, , marketAddress] = event.args;
      return marketAddress;
    } catch (error) {
      console.error("Error deploying orderbook:", error);
      throw errorHandler.handle(error);
    }
  }

  // Main function to check and deploy orderbooks for new KOLs
  async checkAndDeployOrderbooks(): Promise<void> {
    try {
      // Get top 100 KOLs
      const response = await kolService.getTopKOLs();
      const kols = response.data.data;

      // Process each KOL
      for (const kol of kols) {
        const kolAddress = kol.address;

        // Skip if already has orderbook
        if (await this.hasOrderbook(kolAddress)) {
          continue;
        }

        // Deploy new orderbook
        console.log(`Deploying orderbook for KOL ${kolAddress}`);
        const orderBookAddress = await this.deployOrderbook(kolAddress);
        console.log(
          `Deployed orderbook at ${orderBookAddress} for KOL ${kolAddress}`
        );

        // Mark as deployed
        await this.markKOLAsDeployed(kolAddress);
      }
    } catch (error) {
      console.error("Error in checkAndDeployOrderbooks:", error);
      throw errorHandler.handle(error);
    }
  }

  // Initialize service and start periodic checks
  async initialize(): Promise<void> {
    try {
      // Initial check
      await this.checkAndDeployOrderbooks();

      // Set up periodic checks (every hour)
      this.checkInterval = setInterval(async () => {
        try {
          await this.checkAndDeployOrderbooks();
        } catch (error) {
          console.error("Error in periodic orderbook check:", error);
        }
      }, 60 * 60 * 1000); // 1 hour
    } catch (error) {
      console.error("Error initializing KOL orderbook service:", error);
      throw errorHandler.handle(error);
    }
  }

  // Cleanup method for proper shutdown
  cleanup(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

export const kolOrderbookService = new KOLOrderbookService();
