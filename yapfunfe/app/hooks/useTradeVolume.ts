"use client";

import { useState, useEffect } from "react";
import { readContract } from "@wagmi/core";
import { config } from "../providers/Web3Providers";
import { obAbi } from "@/contractAbi/orderBook";

export function useTradeVolume(marketAddress?: `0x${string}`) {
  const [volume, setVolume] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVolume = async () => {
      if (!marketAddress) {
        setVolume(0);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const totalVolume = await readContract(config, {
          abi: obAbi,
          address: marketAddress,
          functionName: "getTotalVolume",
          args: [],
        });

        setVolume(Number(totalVolume));
        setError(null);
      } catch (err) {
        console.error("Error fetching trade volume:", err);
        setError("Failed to fetch trade volume");
        setVolume(0);
      } finally {
        setLoading(false);
      }
    };

    fetchVolume();
  }, [marketAddress]);

  return { volume, loading, error };
}
