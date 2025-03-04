import { redisClient, REDIS_KEYS, REDIS_TTL } from "../config/redis";
import {
  MarketCycle,
  KOLData,
  CrashedOutKOL,
  MarketPosition,
  CycleStatus,
} from "../types/marketCycle";

export class RedisService {
  private static instance: RedisService;

  private constructor() {}

  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  // Cycle Management
  async setCurrentCycle(cycleId: string): Promise<void> {
    await redisClient.set(REDIS_KEYS.CURRENT_CYCLE, cycleId);
  }

  async getCurrentCycle(): Promise<string | null> {
    return redisClient.get(REDIS_KEYS.CURRENT_CYCLE);
  }

  async setCycleData(cycle: MarketCycle): Promise<void> {
    const key = REDIS_KEYS.CYCLE_DATA + cycle.id;
    await redisClient.setex(key, REDIS_TTL.CYCLE_DATA, JSON.stringify(cycle));
  }

  async getCycleData(cycleId: string): Promise<MarketCycle | null> {
    const key = REDIS_KEYS.CYCLE_DATA + cycleId;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  async setCycleStatus(cycleId: string, status: CycleStatus): Promise<void> {
    const key = REDIS_KEYS.CYCLE_STATUS + cycleId;
    await redisClient.set(key, status);
  }

  async getCycleStatus(cycleId: string): Promise<CycleStatus | null> {
    const key = REDIS_KEYS.CYCLE_STATUS + cycleId;
    const status = await redisClient.get(key);
    return status as CycleStatus | null;
  }

  // KOL Management
  async setActiveKOLs(cycleId: string, kols: KOLData[]): Promise<void> {
    const key = REDIS_KEYS.ACTIVE_KOLS + cycleId;
    await redisClient.setex(key, REDIS_TTL.CYCLE_DATA, JSON.stringify(kols));
  }

  async getActiveKOLs(cycleId: string): Promise<KOLData[]> {
    const key = REDIS_KEYS.ACTIVE_KOLS + cycleId;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : [];
  }

  async addCrashedKOL(cycleId: string, kol: CrashedOutKOL): Promise<void> {
    const key = REDIS_KEYS.CRASHED_KOLS + cycleId;
    const crashed = await this.getCrashedKOLs(cycleId);
    crashed.push(kol);
    await redisClient.setex(key, REDIS_TTL.CYCLE_DATA, JSON.stringify(crashed));
  }

  async getCrashedKOLs(cycleId: string): Promise<CrashedOutKOL[]> {
    const key = REDIS_KEYS.CRASHED_KOLS + cycleId;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : [];
  }

  // Market Position Management
  async setMarketPosition(
    marketAddress: string,
    position: MarketPosition
  ): Promise<void> {
    const key = REDIS_KEYS.MARKET_POSITIONS + marketAddress;
    await redisClient.setex(
      key,
      REDIS_TTL.MARKET_POSITIONS,
      JSON.stringify(position)
    );
  }

  async getMarketPosition(
    marketAddress: string
  ): Promise<MarketPosition | null> {
    const key = REDIS_KEYS.MARKET_POSITIONS + marketAddress;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  async updateMarketPositionStatus(
    marketAddress: string,
    isActive: boolean
  ): Promise<void> {
    const position = await this.getMarketPosition(marketAddress);
    if (position) {
      position.isActive = isActive;
      await this.setMarketPosition(marketAddress, position);
    }
  }

  // Utility Methods
  async clearCycleData(cycleId: string): Promise<void> {
    const keys = [
      REDIS_KEYS.CYCLE_DATA + cycleId,
      REDIS_KEYS.ACTIVE_KOLS + cycleId,
      REDIS_KEYS.CRASHED_KOLS + cycleId,
      REDIS_KEYS.CYCLE_STATUS + cycleId,
    ];
    await redisClient.del(...keys);
  }

  async isKOLActive(cycleId: string, kolId: number): Promise<boolean> {
    const activeKOLs = await this.getActiveKOLs(cycleId);
    return activeKOLs.some((kol) => kol.id === kolId);
  }

  async getKOLByMarketAddress(
    cycleId: string,
    marketAddress: string
  ): Promise<KOLData | null> {
    const activeKOLs = await this.getActiveKOLs(cycleId);
    return (
      activeKOLs.find((kol) => kol.marketAddress === marketAddress) || null
    );
  }
}

export const redisService = RedisService.getInstance();
