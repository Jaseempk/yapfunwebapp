"use client";

import { useState, useEffect } from "react";
import { useOrders } from "./useOrders";
import { readContract } from "@wagmi/core";
import { config } from "../providers/Web3Providers";
import { obAbi, obCA } from "@/contractAbi/orderBook";

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
            // Get current mindshare value
            const currentMindshare = Number(
              await readContract(config, {
                abi: obAbi,
                address: obCA,
                functionName: "_getOraclePrice",
                args: [],
              })
            );

            // Calculate PnL based on position type and price difference
            const priceDiff = currentMindshare - order.mindshareValue;
            const orderPnL = order.isLong ? priceDiff : -priceDiff;

            // Multiply by quantity and normalize
            const orderValue = (orderPnL * order.quantity) / 1e6;
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
