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

const CYCLE_DURATION = 72 * 60 * 60 * 1000; // 72 hours in milliseconds

class MarketCycleService {
  private currentCycle: MarketCycle | null = null;
  private marketPositions: Map<string, MarketPosition> = new Map();
  private cycleStatus: CycleStatus = CycleStatus.NOT_STARTED;

  // Initialize a new market cycle
  async initializeCycle(
    firstMarketAddress: string,
    initialKols: KOLData[]
  ): Promise<void> {
    const now = Date.now();
    this.currentCycle = {
      id: now.toString(),
      startTime: now,
      endTime: now + CYCLE_DURATION,
      activeKols: initialKols,
      crashedOutKols: [],
    };
    this.cycleStatus = CycleStatus.ACTIVE;

    // Initialize first market position tracking
    this.marketPositions.set(firstMarketAddress, {
      marketAddress: firstMarketAddress,
      cycleId: this.currentCycle.id,
      activeTokenIds: [],
      isActive: true,
    });
  }

  // Update KOLs based on new Kaito data
  async updateKols(newTopKols: KOLData[]): Promise<void> {
    if (!this.currentCycle || this.cycleStatus !== CycleStatus.ACTIVE) {
      throw new Error("No active cycle");
    }

    const currentKolIds = new Set(
      this.currentCycle.activeKols.map((k) => k.id)
    );
    const newKolIds = new Set(newTopKols.map((k) => k.id));

    // Find KOLs who fell out of top 100
    const crashedOutKols = this.currentCycle.activeKols
      .filter((kol) => {
        return kol.marketAddress && !newKolIds.has(kol.id);
      })
      .map((kol) => ({
        ...kol,
        marketAddress: kol.marketAddress!,
        crashedOutAt: Date.now(),
      }));

    // Remove KOLs who came back to top 100 from crashed out list
    this.currentCycle.crashedOutKols = this.currentCycle.crashedOutKols.filter(
      (kol) => !newKolIds.has(kol.id)
    );

    // Add new crashed out KOLs
    this.currentCycle.crashedOutKols.push(...crashedOutKols);

    // Update active KOLs list
    this.currentCycle.activeKols = newTopKols;
  }

  // Track new position for a market
  async trackPosition(marketAddress: string, tokenId: number): Promise<void> {
    const position = this.marketPositions.get(marketAddress);
    if (position) {
      position.activeTokenIds.push(tokenId);
      this.marketPositions.set(marketAddress, position);
    }
  }

  // Remove position when closed
  async removePosition(marketAddress: string, tokenId: number): Promise<void> {
    const position = this.marketPositions.get(marketAddress);
    if (position) {
      position.activeTokenIds = position.activeTokenIds.filter(
        (id) => id !== tokenId
      );
      this.marketPositions.set(marketAddress, position);
    }
  }

  // Get all active positions for a market
  getActivePositions(marketAddress: string): number[] {
    return this.marketPositions.get(marketAddress)?.activeTokenIds || [];
  }

  // Get crashed out KOLs that need data updates
  getCrashedOutKols(): CrashedOutKOL[] {
    return this.currentCycle?.crashedOutKols || [];
  }

  // Check if cycle needs to end
  async checkCycleEnd(): Promise<boolean> {
    if (!this.currentCycle) return false;
    return Date.now() >= this.currentCycle.endTime;
  }

  // Start cycle end process
  async startCycleEnd(): Promise<void> {
    if (this.cycleStatus !== CycleStatus.ACTIVE) return;
    this.cycleStatus = CycleStatus.ENDING;
  }

  // Reset market for new cycle
  async resetMarket(
    marketAddress: string,
    mindshares: number[]
  ): Promise<void> {
    const contract = new ethers.Contract(marketAddress, orderBookAbi, provider);
    await contract.resetMarket(mindshares);

    // Clear position tracking for this market
    this.marketPositions.set(marketAddress, {
      marketAddress,
      cycleId: this.currentCycle?.id || "",
      activeTokenIds: [],
      isActive: true,
    });
  }

  // Get current cycle status
  getCycleStatus(): CycleStatus {
    return this.cycleStatus;
  }

  // Get current cycle data
  getCurrentCycle(): MarketCycle | null {
    return this.currentCycle;
  }
}

export const marketCycleService = new MarketCycleService();
