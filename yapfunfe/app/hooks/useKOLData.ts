"use client";

import { useQuery, gql } from "@apollo/client";
import { useMemo, useEffect, useState } from "react";
import { readContract } from "@wagmi/core";
import { config } from "../providers/Web3Providers";
import { obFAbi, obfCA } from "@/contractAbi/obFactory";
import { obAbi } from "@/contractAbi/orderBook";

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
    fetchPolicy: "cache-and-network", // Use cache first, then update from network
    nextFetchPolicy: "cache-first", // Use cache for subsequent requests
    errorPolicy: "all", // Return partial data if available
  });

  const [marketAddresses, setMarketAddresses] = useState<
    Record<string, `0x${string}`>
  >({});
  
  // Track which KOLs have zero volume to fetch directly
  const [volumeData, setVolumeData] = useState<Record<string, string>>({});

  // Ensure we only process unique KOLs
  const uniqueKols = useMemo(() => {
    if (!data?.topKOLs?.kols) return [];
    
    // Use a Map to deduplicate by user_id
    const kolMap = new Map();
    data.topKOLs.kols.forEach(kol => {
      if (!kolMap.has(kol.user_id)) {
        kolMap.set(kol.user_id, kol);
      }
    });
    
    // Convert back to array and limit to topN
    return Array.from(kolMap.values()).slice(0, topN);
  }, [data, topN]);

  // Fetch market addresses for KOLs
  useEffect(() => {
    const fetchMarketAddresses = async () => {
      if (uniqueKols.length === 0) return;

      const addresses = await Promise.all(
        uniqueKols.map(async (kol) => {
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

      const validAddresses = Object.fromEntries(
        addresses.filter(
          ([_, address]) =>
            address &&
            address !== "0x0000000000000000000000000000000000000000"
        ) as [string, `0x${string}`][]
      );
      
      setMarketAddresses(validAddresses);
    };

    fetchMarketAddresses();
  }, [uniqueKols]);

  // Fetch volume data directly from blockchain for KOLs with zero volume
  useEffect(() => {
    const fetchVolumeData = async () => {
      if (uniqueKols.length === 0 || Object.keys(marketAddresses).length === 0) return;
      
      // Find KOLs with zero volume that have market addresses
      const zeroVolumeKols = uniqueKols.filter(
        kol => 
          (kol.volume === 0 || !kol.volume) && 
          marketAddresses[kol.user_id]
      );
      
      if (zeroVolumeKols.length === 0) return;
      
      // Fetch volume data directly from contracts
      const volumes = await Promise.all(
        zeroVolumeKols.map(async (kol) => {
          try {
            const marketAddress = marketAddresses[kol.user_id];
            if (!marketAddress) return [kol.user_id, "0"];
            
            const volume = await readContract(config, {
              abi: obAbi,
              address: marketAddress,
              functionName: "marketVolume",
              args: [],
            });
            
            // Format volume as USD string
            const volumeValue = Number(volume)/1e6 ;
            return [kol.user_id, formatUSD(volumeValue)];
          } catch (err) {
            console.error(`Error fetching volume for KOL ${kol.user_id}:`, err);
            return [kol.user_id, "0"];
          }
        })
      );
      
      setVolumeData(prev => ({
        ...prev,
        ...Object.fromEntries(volumes)
      }));
    };
    
    fetchVolumeData();
  }, [uniqueKols, marketAddresses]);

  const formattedData = useMemo(() => {
    if (uniqueKols.length === 0) return [];

    return uniqueKols.map(
      (kol: KOLResponse): KOLData => {
        // Use direct blockchain volume data if available, otherwise use API data
        const volumeString = volumeData[kol.user_id] || formatUSD(kol.volume || 0);
        
        return {
          rank: parseInt(kol.rank),
          name: kol.name,
          handle: `@${kol.username}`,
          avatar: kol.icon,
          mindshare: kol.mindshare * 100, // Convert to percentage
          volume: volumeString,
          participants: kol.trades || 150,
          tweetCount: kol.last_7_day_mention_count || 0,
          performance: "neutral", // Can be enhanced with historical data comparison
          user_id: kol.user_id,
          marketAddress: marketAddresses[kol.user_id],
        };
      }
    );
  }, [uniqueKols, marketAddresses, volumeData]);

  return {
    kols: formattedData,
    loading,
    error,
    latency: data?.topKOLs?.latency,
  };
}
