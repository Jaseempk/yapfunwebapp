// src/services/scheduler.ts

import cron from 'node-cron';
import { marketCycleService } from './marketCycle';

export class SchedulerService {
  private activeMarketCycles: string[] = [];
  
  constructor() {}
  
  // Start the scheduler
  initialize(): void {
    // Run hourly to update market cycle data
    cron.schedule('0 * * * *', async () => {
      console.log('[Scheduler] Running hourly market cycle update');
      
      // Update all active market cycles
      for (const cycleId of this.activeMarketCycles) {
        try {
          // Check if the cycle still exists
          const exists = await marketCycleService.marketCycleExists(cycleId);
          
          if (exists) {
            await marketCycleService.updateMarketCycleData(cycleId);
          } else {
            // Remove from active cycles if it no longer exists
            this.activeMarketCycles = this.activeMarketCycles.filter(id => id !== cycleId);
          }
        } catch (error) {
          console.error(`[Scheduler] Error updating market cycle ${cycleId}:`, error);
        }
      }
    });
  }
  
  // Register a new market cycle
  registerMarketCycle(cycleId: string): void {
    if (!this.activeMarketCycles.includes(cycleId)) {
      this.activeMarketCycles.push(cycleId);
      console.log(`[Scheduler] Registered market cycle ${cycleId}`);
    }
  }
  
  // Unregister a market cycle
  unregisterMarketCycle(cycleId: string): void {
    this.activeMarketCycles = this.activeMarketCycles.filter(id => id !== cycleId);
    console.log(`[Scheduler] Unregistered market cycle ${cycleId}`);
  }
}

export const schedulerService = new SchedulerService();