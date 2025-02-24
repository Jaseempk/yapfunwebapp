"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { readContract } from "@wagmi/core";
import { config } from "../providers/Web3Providers";
import { erc20Abi } from "viem";
import { escrowAbi, escrowCA } from "@/contractAbi/escrowAbi";

const USDC_ADDRESS = "0xC129124eA2Fd4D63C1Fc64059456D8f231eBbed1";

export function useBalances() {
  const { address } = useAccount();
  const [inHouseBalance, setInHouseBalance] = useState("0.00");
  const [userBalance, setUserBalance] = useState("0.00");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInHouseBalance = useCallback(async () => {
    if (!address) return;
    try {
      const data = await readContract(config, {
        abi: escrowAbi,
        address: escrowCA,
        functionName: "getUserBalance",
        args: [address],
      });
      setInHouseBalance((Number(data) / 1e6).toString());
    } catch (err) {
      console.error("Error fetching in-house balance:", err);
      setError("Failed to fetch in-house balance");
      setInHouseBalance("0.00");
    }
  }, [address]);

  const fetchUserBalance = useCallback(async () => {
    if (!address) return;
    try {
      const data = await readContract(config, {
        abi: erc20Abi,
        address: USDC_ADDRESS,
        functionName: "balanceOf",
        args: [address],
      });
      setUserBalance((Number(data) / 1e6).toString());
    } catch (err) {
      console.error("Error fetching user balance:", err);
      setError("Failed to fetch wallet balance");
      setUserBalance("0.00");
    }
  }, [address]);

  const refreshBalances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchInHouseBalance(), fetchUserBalance()]);
    } catch (err) {
      console.error("Error refreshing balances:", err);
      setError("Failed to refresh balances");
    } finally {
      setLoading(false);
    }
  }, [fetchInHouseBalance, fetchUserBalance]);

  useEffect(() => {
    refreshBalances();
    const interval = setInterval(refreshBalances, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [refreshBalances]);

  return {
    inHouseBalance,
    userBalance,
    loading,
    error,
    refreshBalances,
  };
}
