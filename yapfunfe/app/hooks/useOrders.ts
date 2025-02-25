"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  readContract,
  writeContract,
  simulateContract,
  getAccount,
} from "@wagmi/core";
import { config } from "../providers/Web3Providers";
import { baseSepolia } from "wagmi/chains";
import { obAbi, obCA } from "@/contractAbi/orderBook";
import { toast } from "@/components/ui/use-toast";

export interface Order {
  id: number;
  trader: string;
  positionId: number;
  kolId: string;
  isLong: boolean;
  mindshareValue: number;
  quantity: number;
  filledQuantity: number;
  timestamp: number;
  status: number; // 0: Open, 1: Filled, 2: Cancelled
}

export function useOrders() {
  const { address } = useAccount();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);

    try {
      // Get active order count
      const activeOrderCount = await readContract(config, {
        abi: obAbi,
        address: obCA,
        functionName: "getActiveOrderCount",
        args: [],
      });

      const orderPromises = [];
      for (let i = 1; i <= Number(activeOrderCount); i++) {
        orderPromises.push(
          readContract(config, {
            abi: obAbi,
            address: obCA,
            functionName: "getOrderDetails",
            args: [i],
          }).then((details: any) => ({
            id: i,
            trader: details[0] as string,
            positionId: 0, // Default value as it's not returned by contract
            kolId: details[1].toString(),
            isLong: details[2] as boolean,
            mindshareValue: Number(details[3]),
            quantity: Number(details[4]),
            filledQuantity: Number(details[5]),
            status: Number(details[6]),
            timestamp: Date.now(), // TODO: Get from contract if available
          }))
        );
      }

      const fetchedOrders = await Promise.all(orderPromises);
      // Filter orders belonging to the current user
      const userOrders = fetchedOrders.filter(
        (order) => order.trader.toLowerCase() === address.toLowerCase()
      );
      setOrders(userOrders);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to fetch orders");
      toast({
        title: "Error",
        description: "Failed to fetch orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [address]);

  const cancelOrder = async (orderId: number) => {
    if (!address) return;

    try {
      const { request } = await simulateContract(config, {
        abi: obAbi,
        address: obCA,
        functionName: "cancelOrder",
        args: [orderId],
      });
      toast({
        title: "Cancelling Order",
        description: "Please wait while your order is being cancelled...",
      });

      await writeContract(config, request);
      toast({
        title: "Success",
        description: "Order cancelled successfully!",
      });

      // Refresh orders
      await fetchOrders();
    } catch (err) {
      console.error("Error cancelling order:", err);
      toast({
        title: "Error",
        description: "Failed to cancel order. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchOrders();
    // Set up an interval to refresh orders
    const interval = setInterval(fetchOrders, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    cancelOrder,
    refreshOrders: fetchOrders,
  };
}
