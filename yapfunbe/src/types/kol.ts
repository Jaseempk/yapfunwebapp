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
