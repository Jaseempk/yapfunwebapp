import { redisClient, REDIS_KEYS, REDIS_TTL } from "../config/redis";
import {
  MarketCycle,
  KOLData,
  CrashedOutKOL,
  MarketPosition,
  CycleStatus,
  MarketData,
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

  async setGlobalExpiry(
    cycleId: string,
    expiryTimestamp: number
  ): Promise<void> {
    const key = REDIS_KEYS.GLOBAL_EXPIRY + cycleId;
    await redisClient.set(key, expiryTimestamp.toString());
  }

  async getGlobalExpiry(cycleId: string): Promise<number | null> {
    const key = REDIS_KEYS.GLOBAL_EXPIRY + cycleId;
    const expiry = await redisClient.get(key);
    return expiry ? parseInt(expiry) : null;
  }

  async setBufferEndTime(
    cycleId: string,
    bufferEndTime: number
  ): Promise<void> {
    const key = REDIS_KEYS.BUFFER_END + cycleId;
    await redisClient.set(key, bufferEndTime.toString());
  }

  async getBufferEndTime(cycleId: string): Promise<number | null> {
    const key = REDIS_KEYS.BUFFER_END + cycleId;
    const bufferEnd = await redisClient.get(key);
    return bufferEnd ? parseInt(bufferEnd) : null;
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

  // Market Data Management
  async setMarketData(marketAddress: string, data: MarketData): Promise<void> {
    const key = REDIS_KEYS.MARKET_DATA + marketAddress;
    await redisClient.setex(key, REDIS_TTL.MARKET_DATA, JSON.stringify(data));
  }

  async getMarketData(marketAddress: string): Promise<MarketData | null> {
    const key = REDIS_KEYS.MARKET_DATA + marketAddress;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  async addMindshareValue(
    marketAddress: string,
    mindshare: number
  ): Promise<void> {
    const key = REDIS_KEYS.MARKET_MINDSHARES + marketAddress;
    const timestamp = Date.now();
    await redisClient.zadd(key, timestamp, mindshare.toString());
    await redisClient.expire(key, REDIS_TTL.MINDSHARE_DATA);
  }

  async getMindshareValues(marketAddress: string): Promise<number[]> {
    const key = REDIS_KEYS.MARKET_MINDSHARES + marketAddress;
    const values = await redisClient.zrange(key, 0, -1);
    return values.map((v) => parseInt(v));
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

  async addOrderToMarket(
    marketAddress: string,
    orderId: number
  ): Promise<void> {
    const position = await this.getMarketPosition(marketAddress);
    if (position) {
      if (!position.activeTokenIds.includes(orderId)) {
        position.activeTokenIds.push(orderId);
        await this.setMarketPosition(marketAddress, position);
      }
    }
  }

  // Deployment Lock Management
  async acquireDeploymentLock(kolId: string): Promise<boolean> {
    const key = `${REDIS_KEYS.DEPLOYMENT_LOCK}:${kolId}`;
    try {
      // Using setnx for atomic lock acquisition
      const result = await redisClient.setnx(key, '1');
      if (result === 1) {
        // If lock acquired, set expiry
        await redisClient.expire(key, 300); // 5 minutes
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to acquire deployment lock for KOL ${kolId}:`, error);
      return false;
    }
  }

  async releaseDeploymentLock(kolId: string): Promise<void> {
    const key = `${REDIS_KEYS.DEPLOYMENT_LOCK}:${kolId}`;
    await redisClient.del(key);
  }

  // Deployment Status Management
  async setDeploymentStatus(kolId: string, status: 'pending' | 'completed' | 'failed'): Promise<void> {
    const key = `${REDIS_KEYS.DEPLOYMENT_STATUS}:${kolId}`;
    await redisClient.set(key, status);
  }

  async getDeploymentStatus(kolId: string): Promise<string | null> {
    const key = `${REDIS_KEYS.DEPLOYMENT_STATUS}:${kolId}`;
    return redisClient.get(key);
  }

  // Utility Methods
  async clearCycleData(cycleId: string): Promise<void> {
    const keys = [
      REDIS_KEYS.CYCLE_DATA + cycleId,
      REDIS_KEYS.ACTIVE_KOLS + cycleId,
      REDIS_KEYS.CRASHED_KOLS + cycleId,
      REDIS_KEYS.CYCLE_STATUS + cycleId,
      REDIS_KEYS.GLOBAL_EXPIRY + cycleId,
      REDIS_KEYS.BUFFER_END + cycleId,
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

  async getAllActiveMarkets(cycleId: string): Promise<string[]> {
    const cycle = await this.getCycleData(cycleId);
    if (!cycle) return [];

    const activeMarkets = cycle.activeKols
      .filter((kol) => kol.marketAddress)
      .map((kol) => kol.marketAddress as string);

    return activeMarkets;
  }
}

export const redisService = RedisService.getInstance();
