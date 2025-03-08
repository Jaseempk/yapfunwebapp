import { ethers } from "ethers";
import {
  KOLData,
  CrashedOutKOL,
  CycleStatus,
  MarketData,
} from "../types/marketCycle";
import { marketCycleService } from "./marketCycle";
import { provider } from "./contract";
import { orderBookAbi } from "../abi/orderBook";
import { KaitoApiService } from "./kaitoApi";
import { yapOracleAbi, yapOracleCA } from "../abi/yapOracle";
import { redisService } from "./redisService";

interface KaitoResponse {
  kols: Array<{
    id: number;
    mindshare: number;
    username: string;
  }>;
}

class KOLManagementService {
  private isProcessing: boolean = false;

  // Process hourly Kaito API update
  async processKaitoUpdate(kaitoData: KaitoResponse): Promise<void> {
    if (this.isProcessing) {
      console.log("Already processing a Kaito update");
      return;
    }

    try {
      this.isProcessing = true;

      // Transform Kaito data to our format
      const newTopKols: KOLData[] = kaitoData.kols.map((kol) => ({
        id: kol.id,
        mindshare: kol.mindshare,
        username: kol.username,
      }));

      const cycleStatus = await marketCycleService.getCycleStatus();
      const currentCycle = await marketCycleService.getCurrentCycle();

      if (cycleStatus === CycleStatus.NOT_STARTED) {
        // First market deployment will initialize the cycle
        return;
      }

      if (cycleStatus === CycleStatus.ACTIVE) {
        // Update KOLs and track changes
        await marketCycleService.updateKols(newTopKols);

        // Record mindshare values for active markets
        if (currentCycle) {
          for (const kol of currentCycle.activeKols) {
            if (kol.marketAddress) {
              const kolData = newTopKols.find((k) => k.id === kol.id);
              if (kolData) {
                await marketCycleService.recordMindshare(
                  kol.marketAddress,
                  kolData.mindshare
                );
              }
            }
          }
        }

        // Handle crashed out KOLs
        await this.updateCrashedOutKolData();

        // Check if cycle needs to end
        if (await marketCycleService.checkCycleEnd()) {
          console.log("Cycle end detected in KOL management service");
          // Let the scheduler handle the cycle end process
          await marketCycleService.startCycleEnd();
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // Update data for KOLs who fell out of top 100
  private async updateCrashedOutKolData(): Promise<void> {
    const crashedOutKols = await marketCycleService.getCrashedOutKols();
    if (crashedOutKols.length === 0) return;

    console.log(`Updating data for ${crashedOutKols.length} crashed out KOLs`);

    for (const kol of crashedOutKols) {
      try {
        // Fetch fresh data from Kaito API
        const freshData = await KaitoApiService.getIndividualKOLData(
          kol.id.toString()
        );

        if (!freshData) {
          console.warn(`No data returned from Kaito API for KOL ${kol.id}`);
          continue;
        }

        // Update oracle contract with fresh mindshare value
        const signer = new ethers.Wallet(
          process.env.PRIVATE_KEY || "",
          provider
        );
        const contract = new ethers.Contract(yapOracleCA, yapOracleAbi, signer);

        console.log(
          `Updating KOL ${kol.id} with new mindshare: ${freshData.mindshare}`
        );

        const tx = await contract.updateCrashedOutKolData(
          kol.id,
          freshData.rank,
          freshData.mindshare
        );
        await tx.wait();

        // Record mindshare for the market
        if (kol.marketAddress) {
          await marketCycleService.recordMindshare(
            kol.marketAddress,
            freshData.mindshare
          );
        }

        // Add delay between updates to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(
          `Failed to update crashed out KOL data for ID ${kol.id}:`,
          error
        );
      }
    }
  }

  // Deploy a new market for a KOL with dynamic expiry
  async deployMarketWithExpiry(
    kolId: number,
    expiresAt: number
  ): Promise<string | null> {
    try {
      // This is a placeholder - in a real implementation, you would call
      // the market deployment service to deploy a new market
      console.log(
        `Deploying market for KOL ${kolId} with expiry ${new Date(
          expiresAt
        ).toISOString()}`
      );

      // Mock implementation - in reality this would call the deployment service
      // const marketAddress = await marketDeploymentService.deployMarket(kolId.toString());

      // For now, return null to indicate this is not implemented
      return null;
    } catch (error) {
      console.error(`Failed to deploy market for KOL ${kolId}:`, error);
      return null;
    }
  }

  // Reset a market with dynamic expiry
  async resetMarketWithExpiry(
    marketAddress: string,
    kolId: number,
    expiresAt: number
  ): Promise<boolean> {
    try {
      console.log(
        `Resetting market ${marketAddress} for KOL ${kolId} with expiry ${new Date(
          expiresAt
        ).toISOString()}`
      );

      // Get mindshare values for reset
      const mindshares = await marketCycleService.getMindshares(marketAddress);

      // If no mindshares recorded, use the current mindshare from Kaito
      if (mindshares.length === 0) {
        const kolData = await KaitoApiService.getIndividualKOLData(
          kolId.toString()
        );
        if (kolData) {
          mindshares.push(kolData.mindshare);
        } else {
          // Fallback to a default value if needed
          mindshares.push(1000); // Default mindshare value
        }
      }

      // Reset the market with the collected mindshares and new expiry
      await marketCycleService.resetMarket(
        marketAddress,
        mindshares,
        expiresAt
      );

      // Update market data in Redis
      const marketData: MarketData = {
        marketAddress,
        kolId,
        expiresAt,
        mindshares: [],
      };
      await redisService.setMarketData(marketAddress, marketData);

      return true;
    } catch (error) {
      console.error(`Failed to reset market ${marketAddress}:`, error);
      return false;
    }
  }

  // Get current top 100 KOLs
  async getCurrentTopKOLs(): Promise<KOLData[]> {
    const cycle = await marketCycleService.getCurrentCycle();
    return cycle?.activeKols || [];
  }

  // Get crashed out KOLs
  async getCrashedOutKOLs(): Promise<CrashedOutKOL[]> {
    return marketCycleService.getCrashedOutKols();
  }
}

export const kolManagementService = new KOLManagementService();
