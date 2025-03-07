import axios from "axios";

interface KaitoKOLResponse {
  data: {
    mindshare: number;
    username: string;
    rank: number;
  };
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

  // Fetch individual KOL data
  static async getIndividualKOLData(
    kolId: string
  ): Promise<{ mindshare: number; username: string; rank: number } | null> {
    try {
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
        console.error(`No data returned for KOL ${kolId}`);
        return null;
      }

      return {
        mindshare: response.data.data.mindshare,
        username: response.data.data.username,
        rank: response.data.data.rank,
      };
    } catch (error) {
      console.error(`Error fetching data for KOL ${kolId}:`, error);
      return null;
    }
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

    // Process KOLs in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < kolIds.length; i += batchSize) {
      const batch = kolIds.slice(i, i + batchSize);
      const promises = batch.map((kolId) => this.getIndividualKOLData(kolId));

      const batchResults = await Promise.allSettled(promises);

      batchResults.forEach((result, index) => {
        const kolId = batch[index];
        if (result.status === "fulfilled" && result.value) {
          results.set(kolId, result.value);
        }
      });

      // Add delay between batches to respect rate limits
      if (i + batchSize < kolIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
