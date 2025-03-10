import axios, { AxiosError } from "axios";

interface KaitoKOLResponse {
  data: {
    mindshare: number;
    username: string;
    rank: number;
  };
}

interface BatchConfig {
  size: number;
  delay: number;
  successCount: number;
  errorCount: number;
}

export class KaitoApiService {
  private static headers = {
    accept: "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    authorization: "Bearer",
    "content-type": "application/json",
    origin: "https://yaps.kaito.ai",
    priority: "u=1, i",
    "privy-id-token": "",
    referer: "https://yaps.kaito.ai/",
    "sec-ch-ua":
      '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "user-agent":
      "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36",
  };

  private static baseUrl = "https://hub.kaito.ai/api/v1/gateway/ai";
  
  private static batchConfig: BatchConfig = {
    size: 5,        // Start with 5
    delay: 1000,    // Start with 1 second
    successCount: 0,
    errorCount: 0
  };

  private static readonly MIN_BATCH_SIZE = 2;
  private static readonly MAX_BATCH_SIZE = 10;
  private static readonly MIN_DELAY = 500;
  private static readonly MAX_DELAY = 2000;

  private static adjustBatchConfig(success: boolean) {
    if (success) {
      this.batchConfig.successCount++;
      if (this.batchConfig.successCount >= 3) {
        // After 3 consecutive successes, try to optimize
        this.batchConfig.size = Math.min(this.batchConfig.size + 1, this.MAX_BATCH_SIZE);
        this.batchConfig.delay = Math.max(this.batchConfig.delay - 100, this.MIN_DELAY);
        this.batchConfig.successCount = 0;
      }
      this.batchConfig.errorCount = 0;
    } else {
      this.batchConfig.errorCount++;
      this.batchConfig.successCount = 0;
      // Immediately reduce batch size and increase delay on error
      this.batchConfig.size = Math.max(this.batchConfig.size - 1, this.MIN_BATCH_SIZE);
      this.batchConfig.delay = Math.min(this.batchConfig.delay * 1.5, this.MAX_DELAY);
    }
  }

  private static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await operation();
        this.adjustBatchConfig(true); // Success
        return result;
      } catch (error) {
        lastError = error as Error;
        this.adjustBatchConfig(false); // Failure
        
        if (error instanceof AxiosError && error.response?.status === 429) {
          // Rate limit hit - use exponential backoff
          const backoffDelay = Math.min(Math.pow(2, attempt) * 1000, 10000);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          continue;
        }
        
        // For other errors, throw immediately
        throw error;
      }
    }
    
    throw lastError || new Error('Operation failed after retries');
  }

  // Fetch individual KOL data
  static async getIndividualKOLData(
    kolId: string
  ): Promise<{ mindshare: number; username: string; rank: number } | null> {
    return this.retryWithBackoff(async () => {
      const data = {
        path: "/api/yapper/public_kol_mindshare",
        method: "GET",
        params: {
          kol: kolId,
          type: "kol",
          duration: "7d",
          nft_filter: true,
          topic_id: "",
        },
        body: {},
      };

      const response = await axios.post<KaitoKOLResponse>(
        `${this.baseUrl}?kol=${kolId}&type=kol&duration=7d&nft_filter=true&topic_id=`,
        data,
        { headers: this.headers }
      );

      if (!response.data?.data) {
        console.warn(`No data returned for KOL ${kolId}`);
        return null;
      }

      return {
        mindshare: response.data.data.mindshare,
        username: response.data.data.username,
        rank: response.data.data.rank,
      };
    });
  }

  // Batch update crashed out KOLs
  static async updateCrashedOutKOLsData(
    kolIds: string[]
  ): Promise<
    Map<string, { mindshare: number; username: string; rank: number }>
  > {
    const results = new Map<
      string,
      { mindshare: number; username: string; rank: number }
    >();
    
    for (let i = 0; i < kolIds.length; i += this.batchConfig.size) {
      const batch = kolIds.slice(i, i + this.batchConfig.size);
      
      try {
        // Process batch with concurrent requests
        const promises = batch.map(kolId => this.getIndividualKOLData(kolId));
        const batchResults = await Promise.allSettled(promises);

        // Process results
        batchResults.forEach((result, index) => {
          const kolId = batch[index];
          if (result.status === "fulfilled" && result.value) {
            results.set(kolId, result.value);
          }
        });

        // Successful batch, adjust config
        this.adjustBatchConfig(true);

      } catch (error) {
        // Failed batch, adjust config
        this.adjustBatchConfig(false);
        console.error(`Error processing batch starting at index ${i}:`, error);
      }

      // Apply adaptive delay between batches
      if (i + this.batchConfig.size < kolIds.length) {
        await new Promise(resolve => setTimeout(resolve, this.batchConfig.delay));
      }
    }

    return results;
  }

  // Validate KOL data
  static validateKOLData(data: any): boolean {
    return (
      data &&
      typeof data.mindshare === "number" &&
      typeof data.username === "string" &&
      data.mindshare > 0
    );
  }
}
