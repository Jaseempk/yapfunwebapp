import { Market } from "./market";

export interface KOLData {
  id: number;
  mindshare: number;
  username: string;
  marketAddress?: string;
}

export interface CrashedOutKOL extends KOLData {
  marketAddress: string;
  crashedOutAt: number;
}

export interface MarketCycle {
  id: string; // Unique cycle identifier
  startTime: number; // Cycle start timestamp
  endTime: number; // Cycle end timestamp (startTime + 72 hours)
  activeKols: KOLData[]; // Current top 100 KOLs
  crashedOutKols: CrashedOutKOL[]; // KOLs who fell out of top 100
}

export interface MarketPosition {
  marketAddress: string;
  cycleId: string; // Reference to cycle
  activeTokenIds: number[];
  isActive: boolean;
}

export interface MarketCycleState {
  currentCycle: MarketCycle | null;
  marketPositions: { [marketAddress: string]: MarketPosition };
}

export enum CycleStatus {
  NOT_STARTED = "NOT_STARTED",
  ACTIVE = "ACTIVE",
  ENDING = "ENDING", // When closing positions
  ENDED = "ENDED",
}
