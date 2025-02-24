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

// Kaito API response interface
export interface KaitoKOL {
  user_id: string;
  last_7_day_standard_smart_engagement_count: number;
  last_7_day_engagement_count: number;
  last_7_day_mention_count: number;
  last_7_sum_mention_percentage: number;
  last_7_day_avg_llm_insightfulness_score_scaled: number;
  last_7_day_avg_originality_score_scaled: number;
  rank: string;
  last_7_normalized_mention_score: number;
  mindshare: number;
  name: string;
  username: string;
  icon: string;
  bio: string;
  created_at: string;
  following_count: number;
  follower_count: number;
  smart_following_count: number;
  smart_follower_count: number;
  twitter_user_url: string;
}

// Legacy KOL interface for backward compatibility
export interface KOL {
  address: string;
  mindshare: number;
  rank: number;
  volume: number;
  trades: number;
  pnl: number;
  followers: number;
  following: number;
  // Extended fields from Kaito
  user_id?: string;
  name?: string;
  username?: string;
  icon?: string;
  bio?: string;
  twitter_url?: string;
}

export interface KOLAPIResponse {
  data: {
    data: Array<KaitoKOL>;
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
