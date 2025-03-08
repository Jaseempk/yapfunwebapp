import { ethers } from "ethers";
import {
  KOLData,
  MarketCycle,
  CrashedOutKOL,
  MarketPosition,
  CycleStatus,
  MarketData,
} from "../types/marketCycle";
import { provider } from "./contract";
import { orderBookAbi } from "../abi/orderBook";
import { redisService } from "./redisService";

const CYCLE_DURATION = 72 * 60 * 60 * 1000; // 72 hours in milliseconds
const BUFFER_DURATION = 1 * 60 * 60 * 1000; // 1 hour in milliseconds

class MarketCycleService {
  // Initialize a new market cycle
  async initializeCycle(
    firstMarketAddress: string,
    initialKols: KOLData[]
  ): Promise<void> {
    try {
      const now = Date.now();
      const cycleId = now.toString();
      const endTime = now + CYCLE_DURATION;
      const bufferEndTime = endTime + BUFFER_DURATION;
      const globalExpiry = endTime; // Global expiry is the same as cycle end time

      const newCycle: MarketCycle = {
        id: cycleId,
        startTime: now,
        endTime: endTime,
        bufferEndTime: bufferEndTime,
        globalExpiry: globalExpiry,
        activeKols: initialKols,
        crashedOutKols: [],
      };

      // Store cycle data in Redis
      await redisService.setCurrentCycle(cycleId);
      await redisService.setCycleData(newCycle);
      await redisService.setActiveKOLs(cycleId, initialKols);
      await redisService.setCycleStatus(cycleId, CycleStatus.ACTIVE);
      await redisService.setGlobalExpiry(cycleId, globalExpiry);
      await redisService.setBufferEndTime(cycleId, bufferEndTime);

      // Initialize first market position tracking
      const position: MarketPosition = {
        marketAddress: firstMarketAddress,
        cycleId: cycleId,
        activeTokenIds: [],
        isActive: true,
      };
      await redisService.setMarketPosition(firstMarketAddress, position);

      // Initialize market data with expiry
      const marketData: MarketData = {
        marketAddress: firstMarketAddress,
        kolId: initialKols[0]?.id || 0,
        expiresAt: globalExpiry,
        mindshares: [],
      };
      await redisService.setMarketData(firstMarketAddress, marketData);

      console.log(
        `Initialized new market cycle ${cycleId} with end time ${new Date(
          endTime
        ).toISOString()}`
      );
      console.log(
        `Buffer period ends at ${new Date(bufferEndTime).toISOString()}`
      );
    } catch (error) {
      console.error("Failed to initialize cycle:", error);
      throw new Error("Failed to initialize market cycle");
    }
  }

  // Start buffer period after cycle ends
  async startBufferPeriod(): Promise<void> {
    try {
      const cycleId = await redisService.getCurrentCycle();
      if (!cycleId) return;

      const cycle = await redisService.getCycleData(cycleId);
      if (!cycle) return;

      // Set cycle status to BUFFER
      await redisService.setCycleStatus(cycleId, CycleStatus.BUFFER);

      console.log(`Started buffer period for cycle ${cycleId}`);
      console.log(
        `Buffer period ends at ${new Date(cycle.bufferEndTime).toISOString()}`
      );
    } catch (error) {
      console.error("Failed to start buffer period:", error);
      throw new Error("Failed to start buffer period");
    }
  }

  // Check if buffer period has ended
  async checkBufferEnd(): Promise<boolean> {
    try {
      const cycleId = await redisService.getCurrentCycle();
      if (!cycleId) return false;

      const status = await redisService.getCycleStatus(cycleId);
      if (status !== CycleStatus.BUFFER) return false;

      const bufferEndTime = await redisService.getBufferEndTime(cycleId);
      if (!bufferEndTime) return false;

      return Date.now() >= bufferEndTime;
    } catch (error) {
      console.error("Failed to check buffer end:", error);
      return false;
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

  // Reset market for new cycle with dynamic expiry
  async resetMarket(
    marketAddress: string,
    mindshares: number[],
    expiresAt?: number
  ): Promise<void> {
    try {
      const cycleId = await redisService.getCurrentCycle();
      if (!cycleId) throw new Error("No active cycle");

      // Get global expiry if not provided
      if (!expiresAt) {
        const globalExpiry = await redisService.getGlobalExpiry(cycleId);
        if (!globalExpiry) throw new Error("Global expiry not found");
        expiresAt = globalExpiry;
      }

      // Get the signer from provider
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);
      const contract = new ethers.Contract(marketAddress, orderBookAbi, signer);

      console.log(
        `Resetting market ${marketAddress} with expiry ${new Date(
          expiresAt
        ).toISOString()}`
      );
      console.log(`Using mindshare values: ${mindshares.join(", ")}`);

      // Call the contract with the new expiresAt parameter
      const tx = await contract.resetMarket(mindshares, expiresAt);
      await tx.wait();

      // Clear position tracking for this market
      const position: MarketPosition = {
        marketAddress,
        cycleId,
        activeTokenIds: [],
        isActive: true,
      };
      await redisService.setMarketPosition(marketAddress, position);

      // Update market data
      const marketData = (await redisService.getMarketData(marketAddress)) || {
        marketAddress,
        kolId: 0,
        expiresAt: 0,
        mindshares: [],
      };

      marketData.expiresAt = expiresAt;
      marketData.mindshares = []; // Reset mindshares for new cycle
      await redisService.setMarketData(marketAddress, marketData);

      console.log(`Successfully reset market ${marketAddress}`);
    } catch (error) {
      console.error("Failed to reset market:", error);
      throw new Error(
        `Failed to reset market: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  // Close all positions for a market
  async closeAllPositions(marketAddress: string): Promise<void> {
    try {
      const positions = await this.getActivePositions(marketAddress);
      if (positions.length === 0) {
        console.log(`No active positions to close for market ${marketAddress}`);
        return;
      }

      console.log(
        `Closing ${positions.length} positions for market ${marketAddress}`
      );

      // Get the signer from provider
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);
      const contract = new ethers.Contract(marketAddress, orderBookAbi, signer);

      // Close each position
      for (const positionId of positions) {
        try {
          console.log(`Closing position ${positionId}`);
          const tx = await contract.closePosition(positionId);
          await tx.wait();
          console.log(`Successfully closed position ${positionId}`);

          // Remove from tracking
          await this.removePosition(marketAddress, positionId);
        } catch (error) {
          console.error(`Failed to close position ${positionId}:`, error);
          // Continue with other positions even if one fails
        }
      }
    } catch (error) {
      console.error(
        `Failed to close positions for market ${marketAddress}:`,
        error
      );
      throw new Error(
        `Failed to close positions: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  // Record mindshare value for a market
  async recordMindshare(
    marketAddress: string,
    mindshare: number
  ): Promise<void> {
    try {
      await redisService.addMindshareValue(marketAddress, mindshare);

      // Also update the market data
      const marketData = await redisService.getMarketData(marketAddress);
      if (marketData) {
        const data = { ...marketData };
        if (!data.mindshares) {
          data.mindshares = [];
        }
        data.mindshares.push(mindshare);
        await redisService.setMarketData(marketAddress, data);
      }
    } catch (error) {
      console.error(
        `Failed to record mindshare for market ${marketAddress}:`,
        error
      );
    }
  }

  // Get all mindshare values for a market
  async getMindshares(marketAddress: string): Promise<number[]> {
    try {
      return await redisService.getMindshareValues(marketAddress);
    } catch (error) {
      console.error(
        `Failed to get mindshares for market ${marketAddress}:`,
        error
      );
      return [];
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
