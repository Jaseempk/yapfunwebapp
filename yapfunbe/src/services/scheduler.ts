import { CronJob } from "cron";
import axios from "axios";
import { kolManagementService } from "./kolManagement";
import { marketCycleService } from "./marketCycle";

const KAITO_API_URL = process.env.KAITO_API_URL;
const KAITO_API_KEY = process.env.KAITO_API_KEY;

class SchedulerService {
  private kaitoUpdateJob: CronJob;

  constructor() {
    // Run every hour
    this.kaitoUpdateJob = new CronJob(
      "0 * * * *",
      this.processKaitoUpdate.bind(this)
    );
  }

  // Start the scheduler
  start(): void {
    console.log("Starting market cycle scheduler...");
    this.kaitoUpdateJob.start();
  }

  // Stop the scheduler
  stop(): void {
    console.log("Stopping market cycle scheduler...");
    this.kaitoUpdateJob.stop();
  }

  // Process Kaito API update
  private async processKaitoUpdate(): Promise<void> {
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
  getCycleInfo() {
    return {
      currentCycle: marketCycleService.getCurrentCycle(),
      status: marketCycleService.getCycleStatus(),
      topKols: kolManagementService.getCurrentTopKOLs(),
      crashedOutKols: kolManagementService.getCrashedOutKOLs(),
    };
  }
}

export const schedulerService = new SchedulerService();
