// src/services/marketCycle.ts

import { redis, CACHE_PREFIX } from "../config/cache";
import { KOLService } from "./kol";
import { KaitoKOL, KOLAPIResponse, Duration } from "../types/kol";

export class MarketCycleService {
  private kolService: KOLService;
  
  constructor() {
    this.kolService = new KOLService();
  }
  
  // Generate a unique key for each market cycle
  private generateMarketCycleKey(cycleId: string): string {
    return `${CACHE_PREFIX.MARKET}cycle:${cycleId}:kols`;
  }
  
  // Initialize a new market cycle with fresh data
  async initializeMarketCycle(cycleId: string): Promise<void> {
    try {
      // Fetch initial data from Kaito API
      const response = await this.kolService.getTopKOLs(
        Duration.SEVEN_DAYS,
        "",
        100
      );
      
      // Store the data in Redis with the cycle ID
      const cycleKey = this.generateMarketCycleKey(cycleId);
      
      // Create a hash map of user_id -> serialized KOL data
      const pipeline = redis.pipeline();
      
      // Store each KOL by user_id for easy lookup and updates
      response.data.data.forEach(kol => {
        pipeline.hset(cycleKey, kol.user_id, JSON.stringify(kol));
      });
      
      // Set expiration for 4 days (slightly longer than cycle to ensure data availability)
      pipeline.expire(cycleKey, 4 * 24 * 60 * 60);
      
      await pipeline.exec();
      
      console.log(`[Market Cycle] Initialized cycle ${cycleId} with ${response.data.data.length} KOLs`);
    } catch (error) {
      console.error(`[Market Cycle] Error initializing cycle ${cycleId}:`, error);
      throw error;
    }
  }
  
  // Update market cycle data with hourly API call
  async updateMarketCycleData(cycleId: string): Promise<void> {
    try {
      // Fetch latest data
      const response = await this.kolService.getTopKOLs(
        Duration.SEVEN_DAYS,
        "",
        100
      );
      
      const cycleKey = this.generateMarketCycleKey(cycleId);
      
      // Get existing KOL IDs
      const existingKolIds = await redis.hkeys(cycleKey);
      
      // Update existing KOLs and add new ones
      const pipeline = redis.pipeline();
      
      response.data.data.forEach(kol => {
        pipeline.hset(cycleKey, kol.user_id, JSON.stringify(kol));
      });
      
      // Reset expiration time
      pipeline.expire(cycleKey, 4 * 24 * 60 * 60);
      
      await pipeline.exec();
      
      // Count new additions
      const newKolCount = response.data.data.filter(
        kol => !existingKolIds.includes(kol.user_id)
      ).length;
      
      console.log(`[Market Cycle] Updated cycle ${cycleId}, added ${newKolCount} new KOLs`);
    } catch (error) {
      console.error(`[Market Cycle] Error updating cycle ${cycleId}:`, error);
      throw error;
    }
  }
  
  // Get all KOLs for a specific market cycle
  async getMarketCycleKOLs(cycleId: string): Promise<KaitoKOL[]> {
    try {
      const cycleKey = this.generateMarketCycleKey(cycleId);
      
      // Get all KOL data from the hash
      const kolData = await redis.hvals(cycleKey);
      
      // Parse the JSON data
      return kolData.map(data => JSON.parse(data));
    } catch (error) {
      console.error(`[Market Cycle] Error getting KOLs for cycle ${cycleId}:`, error);
      throw error;
    }
  }
  
  // Get a specific KOL from a market cycle
  async getMarketCycleKOL(cycleId: string, kolId: string): Promise<KaitoKOL | null> {
    try {
      const cycleKey = this.generateMarketCycleKey(cycleId);
      
      // Get the specific KOL data
      const kolData = await redis.hget(cycleKey, kolId);
      
      if (!kolData) return null;
      
      // Parse the JSON data
      return JSON.parse(kolData);
    } catch (error) {
      console.error(`[Market Cycle] Error getting KOL ${kolId} for cycle ${cycleId}:`, error);
      throw error;
    }
  }
  
  // End a market cycle by removing its data
  async endMarketCycle(cycleId: string): Promise<void> {
    try {
      const cycleKey = this.generateMarketCycleKey(cycleId);
      
      // Delete the hash
      await redis.del(cycleKey);
      
      console.log(`[Market Cycle] Ended cycle ${cycleId}`);
    } catch (error) {
      console.error(`[Market Cycle] Error ending cycle ${cycleId}:`, error);
      throw error;
    }
  }
  
  // Check if a market cycle exists
  async marketCycleExists(cycleId: string): Promise<boolean> {
    try {
      const cycleKey = this.generateMarketCycleKey(cycleId);
      
      // Check if the key exists
      const exists = await redis.exists(cycleKey);
      
      return exists === 1;
    } catch (error) {
      console.error(`[Market Cycle] Error checking if cycle ${cycleId} exists:`, error);
      throw error;
    }
  }
}

export const marketCycleService = new MarketCycleService();