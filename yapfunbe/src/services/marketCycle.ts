import { ethers } from "ethers";
import {
  KOLData,
  MarketCycle,
  CrashedOutKOL,
  MarketPosition,
  CycleStatus,
} from "../types/marketCycle";
import { provider } from "./contract";
import { orderBookAbi } from "../abi/orderBook";
import { redisService } from "./redisService";

const CYCLE_DURATION = 72 * 60 * 60 * 1000; // 72 hours in milliseconds

class MarketCycleService {
  // Initialize a new market cycle
  async initializeCycle(
    firstMarketAddress: string,
    initialKols: KOLData[]
  ): Promise<void> {
    try {
      const now = Date.now();
      const cycleId = now.toString();

      const newCycle: MarketCycle = {
        id: cycleId,
        startTime: now,
        endTime: now + CYCLE_DURATION,
        activeKols: initialKols,
        crashedOutKols: [],
      };

      // Store cycle data in Redis
      await redisService.setCurrentCycle(cycleId);
      await redisService.setCycleData(newCycle);
      await redisService.setActiveKOLs(cycleId, initialKols);
      await redisService.setCycleStatus(cycleId, CycleStatus.ACTIVE);

      // Initialize first market position tracking
      const position: MarketPosition = {
        marketAddress: firstMarketAddress,
        cycleId: cycleId,
        activeTokenIds: [],
        isActive: true,
      };
      await redisService.setMarketPosition(firstMarketAddress, position);
    } catch (error) {
      console.error("Failed to initialize cycle:", error);
      throw new Error("Failed to initialize market cycle");
    }
  }

  // Update KOLs based on new Kaito data
  async updateKols(newTopKols: KOLData[]): Promise<void> {
    try {
      const cycleId = await redisService.getCurrentCycle();
      if (!cycleId) {
        throw new Error("No active cycle");
      }

      const currentCycle = await redisService.getCycleData(cycleId);
      const status = await redisService.getCycleStatus(cycleId);

      if (!currentCycle || status !== CycleStatus.ACTIVE) {
        throw new Error("No active cycle");
      }

      const currentKolIds = new Set(currentCycle.activeKols.map((k) => k.id));
      const newKolIds = new Set(newTopKols.map((k) => k.id));

      // Find KOLs who fell out of top 100
      const crashedOutKols = currentCycle.activeKols
        .filter((kol) => {
          return kol.marketAddress && !newKolIds.has(kol.id);
        })
        .map((kol) => ({
          ...kol,
          marketAddress: kol.marketAddress!,
          crashedOutAt: Date.now(),
        }));

      // Remove KOLs who came back to top 100 from crashed out list
      const updatedCrashedOutKols = currentCycle.crashedOutKols.filter(
        (kol) => !newKolIds.has(kol.id)
      );

      // Add new crashed out KOLs
      updatedCrashedOutKols.push(...crashedOutKols);

      // Update cycle data in Redis
      const updatedCycle: MarketCycle = {
        ...currentCycle,
        activeKols: newTopKols,
        crashedOutKols: updatedCrashedOutKols,
      };

      await redisService.setCycleData(updatedCycle);
      await redisService.setActiveKOLs(cycleId, newTopKols);
    } catch (error) {
      console.error("Failed to update KOLs:", error);
      throw new Error("Failed to update KOLs");
    }
  }

  // Track new position for a market
  async trackPosition(marketAddress: string, tokenId: number): Promise<void> {
    try {
      const position = await redisService.getMarketPosition(marketAddress);
      if (position) {
        position.activeTokenIds.push(tokenId);
        await redisService.setMarketPosition(marketAddress, position);
      }
    } catch (error) {
      console.error("Failed to track position:", error);
      throw new Error("Failed to track position");
    }
  }

  // Remove position when closed
  async removePosition(marketAddress: string, tokenId: number): Promise<void> {
    try {
      const position = await redisService.getMarketPosition(marketAddress);
      if (position) {
        position.activeTokenIds = position.activeTokenIds.filter(
          (id) => id !== tokenId
        );
        await redisService.setMarketPosition(marketAddress, position);
      }
    } catch (error) {
      console.error("Failed to remove position:", error);
      throw new Error("Failed to remove position");
    }
  }

  // Get all active positions for a market
  async getActivePositions(marketAddress: string): Promise<number[]> {
    try {
      const position = await redisService.getMarketPosition(marketAddress);
      return position?.activeTokenIds || [];
    } catch (error) {
      console.error("Failed to get active positions:", error);
      return [];
    }
  }

  // Get crashed out KOLs that need data updates
  async getCrashedOutKols(): Promise<CrashedOutKOL[]> {
    try {
      const cycleId = await redisService.getCurrentCycle();
      if (!cycleId) return [];

      const cycle = await redisService.getCycleData(cycleId);
      return cycle?.crashedOutKols || [];
    } catch (error) {
      console.error("Failed to get crashed out KOLs:", error);
      return [];
    }
  }

  // Check if cycle needs to end
  async checkCycleEnd(): Promise<boolean> {
    try {
      const cycleId = await redisService.getCurrentCycle();
      if (!cycleId) return false;

      const cycle = await redisService.getCycleData(cycleId);
      return cycle ? Date.now() >= cycle.endTime : false;
    } catch (error) {
      console.error("Failed to check cycle end:", error);
      return false;
    }
  }

  // Start cycle end process
  async startCycleEnd(): Promise<void> {
    try {
      const cycleId = await redisService.getCurrentCycle();
      if (!cycleId) return;

      const status = await redisService.getCycleStatus(cycleId);
      if (status !== CycleStatus.ACTIVE) return;

      await redisService.setCycleStatus(cycleId, CycleStatus.ENDING);
    } catch (error) {
      console.error("Failed to start cycle end:", error);
      throw new Error("Failed to start cycle end");
    }
  }

  // Reset market for new cycle
  async resetMarket(
    marketAddress: string,
    mindshares: number[]
  ): Promise<void> {
    try {
      const contract = new ethers.Contract(
        marketAddress,
        orderBookAbi,
        provider
      );
      await contract.resetMarket(mindshares);

      const cycleId = await redisService.getCurrentCycle();
      if (!cycleId) throw new Error("No active cycle");

      // Clear position tracking for this market
      const position: MarketPosition = {
        marketAddress,
        cycleId,
        activeTokenIds: [],
        isActive: true,
      };
      await redisService.setMarketPosition(marketAddress, position);
    } catch (error) {
      console.error("Failed to reset market:", error);
      throw new Error("Failed to reset market");
    }
  }

  // Get current cycle status
  async getCycleStatus(): Promise<CycleStatus> {
    try {
      const cycleId = await redisService.getCurrentCycle();
      if (!cycleId) return CycleStatus.NOT_STARTED;

      const status = await redisService.getCycleStatus(cycleId);
      return status || CycleStatus.NOT_STARTED;
    } catch (error) {
      console.error("Failed to get cycle status:", error);
      return CycleStatus.NOT_STARTED;
    }
  }

  // Get current cycle data
  async getCurrentCycle(): Promise<MarketCycle | null> {
    try {
      const cycleId = await redisService.getCurrentCycle();
      if (!cycleId) return null;

      return redisService.getCycleData(cycleId);
    } catch (error) {
      console.error("Failed to get current cycle:", error);
      return null;
    }
  }
}

export const marketCycleService = new MarketCycleService();
