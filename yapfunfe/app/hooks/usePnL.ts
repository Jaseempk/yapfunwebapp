"use client";

import { useState, useEffect } from "react";
import { useOrders } from "./useOrders";
import { readContract } from "@wagmi/core";
import { config } from "../providers/Web3Providers";
import { obAbi } from "@/contractAbi/orderBook";
import { obFAbi, obfCA } from "@/contractAbi/obFactory";

export function usePnL() {
  const { orders } = useOrders();
  const [totalPnL, setTotalPnL] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculatePnL = async () => {
      if (!orders.length) {
        setTotalPnL(0);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let total = 0;
        for (const order of orders) {
          if (order.status === 1) {
            // Only count completed orders
            // Get market address for this KOL
            const marketAddress = (await readContract(config, {
              abi: obFAbi,
              address: obfCA,
              functionName: "kolIdToMarket",
              args: [order.kolId],
            })) as `0x${string}`;

            if (
              marketAddress === "0x0000000000000000000000000000000000000000"
            ) {
              console.error(`No market found for KOL ${order.kolId}`);
              continue;
            }

            // Get current mindshare value from the specific market
            const currentMindshare = Number(
              await readContract(config, {
                abi: obAbi,
                address: marketAddress,
                functionName: "_getOraclePrice",
                args: [],
              })
            );

            // Calculate PnL based on position type and price difference
            const priceDiff =
              currentMindshare / 1e18 - order.mindshareValue / 1e18;
            const orderPnL = order.isLong ? priceDiff : -priceDiff;

            // Multiply by quantity and normalize
            const orderValue = (orderPnL * (order.quantity / 1e6)) / 1e18;

            total += orderValue;
          }
        }

        setTotalPnL(total);
      } catch (err) {
        console.error("Error calculating PnL:", err);
        setError("Failed to calculate PnL");
      } finally {
        setLoading(false);
      }
    };

    calculatePnL();
  }, [orders]);

  return {
    totalPnL,
    loading,
    error,
    isPositive: totalPnL >= 0,
    formattedPnL: `${totalPnL >= 0 ? "+" : ""}$${Math.abs(totalPnL).toFixed(
      2
    )}`,
  };
}
