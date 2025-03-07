import { ethers } from "ethers";
import { KOLData, CrashedOutKOL, CycleStatus } from "../types/marketCycle";
import { marketCycleService } from "./marketCycle";
import { provider } from "./contract";
import { orderBookAbi } from "../abi/orderBook";
import { KaitoApiService } from "./kaitoApi";
import { yapOracleAbi, yapOracleCA } from "src/abi/yapOracle";

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

        // Handle crashed out KOLs
        await this.updateCrashedOutKolData();

        // Check if cycle needs to end
        if (await marketCycleService.checkCycleEnd()) {
          await this.startCycleEnd(newTopKols);
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
        const contract = new ethers.Contract(
          yapOracleCA,
          yapOracleAbi,
          provider
        );

        console.log(
          `Updating KOL ${kol.id} with new mindshare: ${freshData.mindshare}`
        );
        await contract.updateCrashedOutKolData(
          kol.id,
          freshData.rank,
          freshData.mindshare
        );

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

  // Handle cycle end process
  private async startCycleEnd(currentTopKols: KOLData[]): Promise<void> {
    await marketCycleService.startCycleEnd();

    // Close all positions for each market
    const cycle = await marketCycleService.getCurrentCycle();
    if (!cycle) return;

    // Get all markets with active positions
    const activeMarkets = [...cycle.activeKols, ...cycle.crashedOutKols]
      .filter((kol) => kol.marketAddress)
      .map((kol) => kol.marketAddress!);

    // Close positions for each market
    for (const marketAddress of activeMarkets) {
      const positions = await marketCycleService.getActivePositions(
        marketAddress
      );
      const contract = new ethers.Contract(
        marketAddress,
        orderBookAbi,
        provider
      );

      // Close each position
      for (const tokenId of positions) {
        try {
          await contract.closePosition(tokenId);
        } catch (error) {
          console.error(
            `Failed to close position ${tokenId} for market ${marketAddress}:`,
            error
          );
        }
      }

      // Reset market with new mindshare values
      const marketKol = currentTopKols.find(
        (k) => k.marketAddress === marketAddress
      );
      if (marketKol) {
        try {
          await marketCycleService.resetMarket(marketAddress, [
            marketKol.mindshare,
          ]);
        } catch (error) {
          console.error(`Failed to reset market ${marketAddress}:`, error);
        }
      }
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
