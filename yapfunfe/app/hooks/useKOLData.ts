"use client";

import { useQuery, gql } from "@apollo/client";
import { useMemo, useEffect, useState } from "react";
import { readContract } from "@wagmi/core";
import { config } from "../providers/Web3Providers";
import { obFAbi, obfCA } from "@/contractAbi/obFactory";

// GraphQL query for fetching KOL data
const GET_TOP_KOLS = gql`
  query GetTopKOLs($duration: Duration!, $topN: Int!) {
    topKOLs(duration: $duration, topN: $topN) {
      kols {
        user_id
        name
        username
        icon
        mindshare
        rank
        volume
        trades
        pnl
        followers
        following
        bio
        twitter_url
        last_7_day_mention_count
      }
      latency
    }
  }
`;

// Map time filter values to GraphQL Duration enum
const timeFilterToDuration: Record<string, string> = {
  "24h": "ONE_DAY",
  "7d": "SEVEN_DAYS",
  "30d": "THIRTY_DAYS",
  "90d": "NINETY_DAYS",
  "180d": "HALF_YEAR",
  "1y": "ONE_YEAR",
  all: "ALL_TIME",
};

// Format number to USD string
const formatUSD = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
};

export interface KOLData {
  rank: number;
  name: string;
  handle: string;
  avatar: string;
  mindshare: number;
  performance?: "up" | "down" | "neutral";
  volume: string;
  participants: number;
  tweetCount: number;
  isTop?: boolean;
  user_id: string;
  marketAddress?: `0x${string}`;
}

interface UseKOLDataProps {
  timeFilter: string;
  topN?: number;
}

interface KOLResponse {
  user_id: string;
  name: string;
  username: string;
  icon: string;
  mindshare: number;
  rank: string;
  volume: number;
  trades: number;
  pnl: number;
  followers: number;
  following: number;
  bio: string;
  twitter_url: string;
  last_7_day_mention_count: number;
}

interface TopKOLsResponse {
  topKOLs: {
    kols: KOLResponse[];
    latency: number;
  };
}

export function useKOLData({ timeFilter, topN = 100 }: UseKOLDataProps) {
  const { loading, error, data } = useQuery<TopKOLsResponse>(GET_TOP_KOLS, {
    variables: {
      duration: timeFilterToDuration[timeFilter] || "SEVEN_DAYS",
      topN,
    },
    fetchPolicy: "network-only", // Don't use cache for this query
    errorPolicy: "all", // Return partial data if available
  });

  const [marketAddresses, setMarketAddresses] = useState<
    Record<string, `0x${string}`>
  >({});

  // Fetch market addresses for KOLs
  useEffect(() => {
    const fetchMarketAddresses = async () => {
      if (!data?.topKOLs?.kols) return;

      const addresses = await Promise.all(
        data.topKOLs.kols.map(async (kol) => {
          try {
            const address = await readContract(config, {
              abi: obFAbi,
              address: obfCA,
              functionName: "kolIdToMarket",
              args: [kol.user_id],
            });
            return [kol.user_id, address] as [string, `0x${string}`];
          } catch (err) {
            console.error(
              `Error fetching market address for KOL ${kol.user_id}:`,
              err
            );
            return [kol.user_id, null];
          }
        })
      );

      setMarketAddresses(
        Object.fromEntries(
          addresses.filter(
            ([_, address]) =>
              address &&
              address !== "0x0000000000000000000000000000000000000000"
          ) as [string, `0x${string}`][]
        )
      );
    };

    fetchMarketAddresses();
  }, [data]);

  const formattedData = useMemo(() => {
    if (!data?.topKOLs?.kols) return [];

    return data.topKOLs.kols.map(
      (kol: KOLResponse): KOLData => ({
        rank: parseInt(kol.rank),
        name: kol.name,
        handle: `@${kol.username}`,
        avatar: kol.icon,
        mindshare: kol.mindshare * 100, // Convert to percentage
        volume: formatUSD(kol.volume || 1000000), // Use actual trade data if available
        participants: kol.trades || 150,
        tweetCount: kol.last_7_day_mention_count || 0,
        performance: "neutral", // Can be enhanced with historical data comparison
        user_id: kol.user_id,
        marketAddress: marketAddresses[kol.user_id],
      })
    );
  }, [data, marketAddresses]);

  return {
    kols: formattedData,
    loading,
    error,
    latency: data?.topKOLs?.latency,
  };
}
