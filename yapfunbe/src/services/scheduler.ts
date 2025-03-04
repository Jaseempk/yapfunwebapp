import { CronJob } from "cron";
import axios from "axios";
import { kolManagementService } from "./kolManagement";
import { marketCycleService } from "./marketCycle";
import { redisClient } from "../config/redis";

const KAITO_API_URL = process.env.KAITO_API_URL;
const KAITO_API_KEY = process.env.KAITO_API_KEY;

class SchedulerService {
  private kaitoUpdateJob: CronJob;
  private redisHealthCheckJob: CronJob;
  private isRedisHealthy: boolean = false;

  constructor() {
    // Run Kaito update every hour
    this.kaitoUpdateJob = new CronJob(
      "0 * * * *",
      this.processKaitoUpdate.bind(this)
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
    this.redisHealthCheckJob.start();
    console.log("Scheduler started successfully");
  }

  // Stop the scheduler
  stop(): void {
    console.log("Stopping market cycle scheduler...");
    this.kaitoUpdateJob.stop();
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
      }

      // Attempt to reconnect Redis
      try {
        await redisClient.connect();
      } catch (reconnectError) {
        console.error("Redis reconnection failed:", reconnectError);
      }
    }
  }

  // Process Kaito API update
  private async processKaitoUpdate(): Promise<void> {
    if (!this.isRedisHealthy) {
      console.log("Skipping Kaito update: Redis is not healthy");
      return;
    }

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

      // Process the update
      await kolManagementService.processKaitoUpdate(response.data);

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

    return {
      currentCycle: await marketCycleService.getCurrentCycle(),
      status: await marketCycleService.getCycleStatus(),
      topKols: await kolManagementService.getCurrentTopKOLs(),
      crashedOutKols: await kolManagementService.getCrashedOutKOLs(),
    };
  }

  // Get Redis health status
  isHealthy(): boolean {
    return this.isRedisHealthy;
  }
}

export const schedulerService = new SchedulerService();
