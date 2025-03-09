import { CronJob } from "cron";
import axios from "axios";
import { kolManagementService } from "./kolManagement";
import { marketCycleService } from "./marketCycle";
import { redisClient } from "../config/redis";
import { CycleStatus, KOLData } from "../types/marketCycle";
import { redisService } from "./redisService";
import { kolService } from "./kol";
import { getMarketDeploymentService } from "./market/deployment";

const KAITO_API_URL = process.env.KAITO_API_URL;
const KAITO_API_KEY = process.env.KAITO_API_KEY;

class SchedulerService {
  private kaitoUpdateJob: CronJob;
  private cycleCheckJob: CronJob;
  private redisHealthCheckJob: CronJob;
  private isRedisHealthy: boolean = false;

  constructor() {
    // Run Kaito update every hour
    this.kaitoUpdateJob = new CronJob(
      "0 * * * *",
      this.processKaitoUpdate.bind(this)
    );

    // Check cycle status every 5 minutes
    this.cycleCheckJob = new CronJob(
      "*/5 * * * *",
      this.checkCycleStatus.bind(this)
    );

    // Check Redis health every minute
    this.redisHealthCheckJob = new CronJob(
      "* * * * *",
      this.checkRedisHealth.bind(this)
    );
  }

  // Start the scheduler
  async start(): Promise<void> {
    console.log("Starting market cycle scheduler...");

    // Initial Redis health check
    await this.checkRedisHealth();

    if (!this.isRedisHealthy) {
      console.error("Redis is not healthy. Scheduler will not start.");
      return;
    }

    this.kaitoUpdateJob.start();
    this.cycleCheckJob.start();
    this.redisHealthCheckJob.start();
    console.log("Scheduler started successfully");

    // Initial cycle check
    await this.checkCycleStatus();
    
    // Initial Kaito update
    try {
      console.log("Running initial Kaito data update...");
      await this.processKaitoUpdate();
      console.log("Initial Kaito data update completed");
    } catch (error) {
      console.error("Failed to run initial Kaito update:", error);
      // Continue even if initial update fails
    }
  }

  // Stop the scheduler
  stop(): void {
    console.log("Stopping market cycle scheduler...");
    this.kaitoUpdateJob.stop();
    this.cycleCheckJob.stop();
    this.redisHealthCheckJob.stop();
  }

  // Check Redis health
  private async checkRedisHealth(): Promise<void> {
    try {
      await redisClient.ping();
      if (!this.isRedisHealthy) {
        console.log("Redis connection restored");
        this.isRedisHealthy = true;
      }
    } catch (error) {
      console.error("Redis health check failed:", error);
      this.isRedisHealthy = false;

      // Stop jobs if Redis is down
      if (this.kaitoUpdateJob.lastDate()) {
        // If lastDate exists, the job is running
        console.log("Stopping jobs due to Redis failure");
        this.kaitoUpdateJob.stop();
        this.cycleCheckJob.stop();
      }

      // Attempt to reconnect Redis
      try {
        await redisClient.connect();
      } catch (reconnectError) {
        console.error("Redis reconnection failed:", reconnectError);
      }
    }
  }

  // Check cycle status and handle transitions
  private async checkCycleStatus(): Promise<void> {
    if (!this.isRedisHealthy) {
      console.log("Skipping cycle check: Redis is not healthy");
      return;
    }

    try {
      const status = await marketCycleService.getCycleStatus();
      const cycle = await marketCycleService.getCurrentCycle();

      if (!cycle) {
        console.log("No active cycle found during cycle check");
        // This should not happen if initialization is done correctly in index.ts
        // But if it does, we'll log it and return
        return;
      }

      console.log(`Current cycle status: ${status}, ID: ${cycle.id}`);
      console.log(`Cycle ends at: ${new Date(cycle.endTime).toISOString()}`);

      switch (status) {
        case CycleStatus.ACTIVE:
          // Check if cycle needs to end
          if (await marketCycleService.checkCycleEnd()) {
            console.log("Cycle end detected, starting closing process");
            await this.handleCycleEnd(cycle.id);
          }
          break;

        case CycleStatus.ENDING:
          // Already in ending state, check if all positions are closed
          await this.checkEndingProgress(cycle.id);
          break;

        case CycleStatus.BUFFER:
          // Check if buffer period has ended
          if (await marketCycleService.checkBufferEnd()) {
            console.log("Buffer period ended, starting new cycle");
            await this.startNewCycle();
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error("Failed to check cycle status:", error);
    }
  }

  // Handle cycle end process
  private async handleCycleEnd(cycleId: string): Promise<void> {
    try {
      // Start cycle end process
      await marketCycleService.startCycleEnd();

      // Get all active markets
      const activeMarkets = await redisService.getAllActiveMarkets(cycleId);
      console.log(`Found ${activeMarkets.length} active markets to close`);

      // Close positions for each market
      for (const marketAddress of activeMarkets) {
        try {
          console.log(`Closing positions for market ${marketAddress}`);
          await marketCycleService.closeAllPositions(marketAddress);
        } catch (error) {
          console.error(
            `Failed to close positions for market ${marketAddress}:`,
            error
          );
          // Continue with other markets even if one fails
        }
      }

      // Start buffer period
      await marketCycleService.startBufferPeriod();
    } catch (error) {
      console.error("Failed to handle cycle end:", error);
    }
  }

  // Check if all positions are closed during ENDING state
  private async checkEndingProgress(cycleId: string): Promise<void> {
    try {
      const activeMarkets = await redisService.getAllActiveMarkets(cycleId);
      let allClosed = true;

      // Check if any market still has active positions
      for (const marketAddress of activeMarkets) {
        const positions = await marketCycleService.getActivePositions(
          marketAddress
        );
        if (positions.length > 0) {
          allClosed = false;
          console.log(
            `Market ${marketAddress} still has ${positions.length} active positions`
          );

          // Try to close positions again
          try {
            await marketCycleService.closeAllPositions(marketAddress);
          } catch (error) {
            console.error(
              `Failed to close positions for market ${marketAddress}:`,
              error
            );
          }
        }
      }

      // If all positions are closed, start buffer period
      if (allClosed) {
        console.log("All positions closed, starting buffer period");
        await marketCycleService.startBufferPeriod();
      }
    } catch (error) {
      console.error("Failed to check ending progress:", error);
    }
  }

  // Start a new cycle
  private async startNewCycle(): Promise<void> {
    try {
      // Get latest KOL data
      const kaitoData = await this.fetchKaitoData();
      if (!kaitoData || !kaitoData.kols || kaitoData.kols.length === 0) {
        console.error("Failed to fetch KOL data for new cycle");
        return;
      }

      // Transform Kaito data to our format
      const initialKols = kaitoData.kols.map((kol: any) => ({
        id: kol.id,
        mindshare: kol.mindshare,
        username: kol.username,
        marketAddress: undefined, // Will be populated later for existing markets
      }));

      // Check for existing markets for these KOLs
      for (let i = 0; i < initialKols.length; i++) {
        try {
          // Use kolService to get market address
          const kol = await kolService.getKOL(initialKols[i].id.toString());
          if (kol && kol.marketAddress) {
            initialKols[i].marketAddress = kol.marketAddress;
            console.log(
              `Found existing market ${kol.marketAddress} for KOL ${initialKols[i].id}`
            );
          }
        } catch (error) {
          // Market doesn't exist, will be deployed later
          console.log(`No existing market found for KOL ${initialKols[i].id}`);
        }
      }

      // Use the new handleBufferEnd method to start a new cycle
      await marketCycleService.handleBufferEnd(initialKols);

      // Deploy markets for new KOLs that don't have markets yet
      const kolsWithoutMarkets = initialKols.filter(
        (kol: KOLData) => !kol.marketAddress
      );
      if (kolsWithoutMarkets.length > 0) {
        const kolIds = kolsWithoutMarkets.map((kol: KOLData) =>
          kol.id.toString()
        );
        console.log(`Deploying markets for ${kolIds.length} new KOLs`);

        // Get the market deployment service
        const marketDeploymentService = getMarketDeploymentService();

        // Deploy markets for each KOL
        for (const kolId of kolIds) {
          try {
            await marketDeploymentService.deployMarket(kolId);
            console.log(`Deployed market for KOL ${kolId}`);
          } catch (error) {
            console.error(`Failed to deploy market for KOL ${kolId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Failed to start new cycle:", error);
    }
  }

  // Fetch data from Kaito API
  private async fetchKaitoData(): Promise<any> {
    try {
      console.log("Fetching Kaito API data...");

      const response = await axios.get(KAITO_API_URL!, {
        headers: {
          Authorization: `Bearer ${KAITO_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.data || !response.data.kols) {
        throw new Error("Invalid Kaito API response");
      }

      return response.data;
    } catch (error) {
      console.error("Failed to fetch Kaito data:", error);
      return null;
    }
  }

  // Process Kaito API update
  private async processKaitoUpdate(): Promise<void> {
    if (!this.isRedisHealthy) {
      console.log("Skipping Kaito update: Redis is not healthy");
      return;
    }

    try {
      const kaitoData = await this.fetchKaitoData();
      if (!kaitoData) return;

      // Process the update
      await kolManagementService.processKaitoUpdate(kaitoData);

      // Record mindshare values for active markets
      const cycleId = await redisService.getCurrentCycle();
      if (cycleId) {
        const activeMarkets = await redisService.getAllActiveMarkets(cycleId);

        for (const marketAddress of activeMarkets) {
          const kol = await redisService.getKOLByMarketAddress(
            cycleId,
            marketAddress
          );
          if (kol) {
            const kolData = kaitoData.kols.find((k: any) => k.id === kol.id);
            if (kolData) {
              await marketCycleService.recordMindshare(
                marketAddress,
                kolData.mindshare
              );
            }
          }
        }
      }

      console.log("Kaito update processed successfully");
    } catch (error) {
      console.error("Failed to process Kaito update:", error);
    }
  }

  // Get current cycle info
  async getCycleInfo() {
    if (!this.isRedisHealthy) {
      throw new Error("Redis is not available");
    }

    const cycle = await marketCycleService.getCurrentCycle();
    const status = await marketCycleService.getCycleStatus();
    const crashedOutKols = await marketCycleService.getCrashedOutKols();

    return {
      currentCycle: cycle,
      status: status,
      topKols: await kolManagementService.getCurrentTopKOLs(),
      crashedOutKols: crashedOutKols,
      bufferEndTime: cycle?.bufferEndTime,
      globalExpiry: cycle?.globalExpiry,
      isInBuffer: status === CycleStatus.BUFFER,
    };
  }

  // Get Redis health status
  isHealthy(): boolean {
    return this.isRedisHealthy;
  }
}

export const schedulerService = new SchedulerService();
