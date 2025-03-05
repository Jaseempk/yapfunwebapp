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
import { obAbi } from "@/contractAbi/orderBook";
import { obFAbi, obfCA } from "@/contractAbi/obFactory";
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

interface KOL {
  user_id: string;
  marketAddress?: `0x${string}`;
}

export function useOrders(kolId?: string, userAddress?: string, kols?: KOL[]) {
  const { address } = useAccount();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);

    try {
      let fetchedOrders: Order[] = [];

      if (kolId) {
        // Get market address for specific KOL
        let marketAddress: `0x${string}`;
        const kol = kols?.find((k) => k.user_id === kolId);

        if (kol?.marketAddress) {
          marketAddress = kol.marketAddress;
        } else {
          marketAddress = (await readContract(config, {
            abi: obFAbi,
            address: obfCA,
            functionName: "kolIdToMarket",
            args: [kolId],
          })) as `0x${string}`;
        }

        if (marketAddress === "0x0000000000000000000000000000000000000000") {
          setOrders([]);
          return;
        }

        // Get active order count for this market
        const activeOrderCount = await readContract(config, {
          abi: obAbi,
          address: marketAddress,
          functionName: "getActiveOrderCount",
          args: [],
        });

        const orderPromises = [];
        for (let i = 1; i <= Number(activeOrderCount); i++) {
          orderPromises.push(
            readContract(config, {
              abi: obAbi,
              address: marketAddress,
              functionName: "getOrderDetails",
              args: [i],
            }).then((details: any) => ({
              id: i,
              trader: details[0] as string,
              positionId: 0,
              kolId: details[1].toString(),
              isLong: details[2] as boolean,
              mindshareValue: Number(details[3]),
              quantity: Number(details[4]),
              filledQuantity: Number(details[5]),
              status: Number(details[6]),
              timestamp: Date.now(),
            }))
          );
        }

        fetchedOrders = await Promise.all(orderPromises);
      } else {
        if (!kols) {
          console.warn("No KOLs provided for fetching all orders");
          return;
        }

        // Fetch orders from all markets
        const allOrderPromises = await Promise.all(
          kols.map(async (kol) => {
            try {
              let marketAddress: `0x${string}`;

              if (kol.marketAddress) {
                marketAddress = kol.marketAddress;
              } else {
                marketAddress = (await readContract(config, {
                  abi: obFAbi,
                  address: obfCA,
                  functionName: "kolIdToMarket",
                  args: [kol.user_id],
                })) as `0x${string}`;
              }

              if (
                marketAddress === "0x0000000000000000000000000000000000000000"
              ) {
                return [];
              }

              const activeOrderCount = await readContract(config, {
                abi: obAbi,
                address: marketAddress,
                functionName: "getActiveOrderCount",
                args: [],
              });

              const marketOrders = await Promise.all(
                Array.from({ length: Number(activeOrderCount) }, (_, i) =>
                  readContract(config, {
                    abi: obAbi,
                    address: marketAddress,
                    functionName: "getOrderDetails",
                    args: [i + 1],
                  }).then((details: any) => ({
                    id: i + 1,
                    trader: details[0] as string,
                    positionId: 0,
                    kolId: details[1].toString(),
                    isLong: details[2] as boolean,
                    mindshareValue: Number(details[3]),
                    quantity: Number(details[4]),
                    filledQuantity: Number(details[5]),
                    status: Number(details[6]),
                    timestamp: Date.now(),
                  }))
                )
              );

              return marketOrders;
            } catch (err) {
              console.error(
                `Error fetching orders for KOL ${kol.user_id}:`,
                err
              );
              return [];
            }
          })
        );

        fetchedOrders = allOrderPromises.flat();
      }
      // Filter orders belonging to the current user
      const filteredOrders = fetchedOrders.filter((order) => {
        if (userAddress) {
          return order.trader.toLowerCase() === userAddress.toLowerCase();
        }
        return order.trader.toLowerCase() === address?.toLowerCase();
      });
      setOrders(filteredOrders);
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
  }, [address, kolId, kols]);

  const cancelOrder = async (orderId: number, marketAddress: `0x${string}`) => {
    if (!address) return;

    try {
      const { request } = await simulateContract(config, {
        abi: obAbi,
        address: marketAddress,
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
    const interval = setInterval(fetchOrders, 3000000); // Every 30 seconds
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
