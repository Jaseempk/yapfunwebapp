export enum Duration {
  ONE_DAY = "ONE_DAY",
  SEVEN_DAYS = "SEVEN_DAYS",
  THIRTY_DAYS = "THIRTY_DAYS",
  NINETY_DAYS = "NINETY_DAYS",
  HALF_YEAR = "HALF_YEAR",
  ONE_YEAR = "ONE_YEAR",
  ALL_TIME = "ALL_TIME",
}

// Map GraphQL Duration enum to API duration string
export const DurationMap: Record<Duration, string> = {
  [Duration.ONE_DAY]: "1d",
  [Duration.SEVEN_DAYS]: "7d",
  [Duration.THIRTY_DAYS]: "30d",
  [Duration.NINETY_DAYS]: "90d",
  [Duration.HALF_YEAR]: "180d",
  [Duration.ONE_YEAR]: "365d",
  [Duration.ALL_TIME]: "all",
};

export interface KOL {
  address: string;
  mindshare: number;
  rank: number;
  volume: number;
  trades: number;
  pnl: number;
  followers: number;
  following: number;
}

export interface KOLAPIResponse {
  data: {
    data: Array<{
      address: string;
      mindshare: string;
      rank: string;
      volume: string;
      trades: string;
      pnl: string;
      followers: string;
      following: string;
    }>;
  };
  latency?: number;
}

export interface KOLQueryResponse {
  kols: KOL[];
  latency?: number;
}

export interface KOLQueryArgs {
  duration?: Duration;
  topicId?: string;
  topN?: number;
}

export interface KOLResolvers {
  Query: {
    topKOLs: (
      parent: unknown,
      args: KOLQueryArgs,
      context: { redis: any }
    ) => Promise<KOLQueryResponse>;
  };
}
