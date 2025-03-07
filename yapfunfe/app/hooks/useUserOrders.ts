"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { apolloClient } from "../lib/apollo-client";
import { gql } from "@apollo/client";
import { readContract } from "@wagmi/core";
import { config } from "../providers/Web3Providers";
import { obFAbi, obfCA } from "@/contractAbi/obFactory";
import { obAbi } from "@/contractAbi/orderBook";
import { Address } from "viem";
import { useKOLData } from "./useKOLData";

// GraphQL query to fetch order events for a specific user
const USER_ORDERS_QUERY = gql`
  query GetUserOrders($user: String!) {
    orderCreateds(
      where: { trader: $user }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      orderId
      trader
      kolId
      isLong
      mindshareValue
      quantity
      blockTimestamp
    }
    positionCloseds(
      where: { user: $user }
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      positionId
      market
      pnl
      blockTimestamp
    }
  }
`;

export interface UserOrder {
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
  marketAddress: `0x${string}`;
}

interface OrderCreatedEvent {
  id: string;
  orderId: string;
  trader: string;
  kolId: string;
  isLong: boolean;
  mindshareValue: string;
  quantity: string;
  blockTimestamp: string;
}

interface PositionClosedEvent {
  id: string;
  positionId: string;
  market: string;
  pnl: string;
  blockTimestamp: string;
}

export function useUserOrders() {
  const { address } = useAccount();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { kols } = useKOLData({ timeFilter: "7d" });

  // Cache for market addresses by kolId
  const [marketAddressCache, setMarketAddressCache] = useState<Record<string, `0x${string}`>>({});

  // Get market address for a KOL ID
  const getMarketAddress = useCallback(async (kolId: string): Promise<`0x${string}` | null> => {
    // Check cache first
    if (marketAddressCache[kolId]) {
      return marketAddressCache[kolId];
    }

    // Check if we have it in kols data
    const kol = kols.find(k => k.user_id === kolId);
    if (kol?.marketAddress) {
      // Update cache
      setMarketAddressCache(prev => ({
        ...prev,
        [kolId]: kol.marketAddress as `0x${string}`
      }));
      return kol.marketAddress as `0x${string}`;
    }

    // Fetch from contract
    try {
      const marketAddress = await readContract(config, {
        abi: obFAbi,
        address: obfCA,
        functionName: "kolIdToMarket",
        args: [kolId],
      }) as `0x${string}`;

      if (marketAddress && marketAddress !== "0x0000000000000000000000000000000000000000") {
        // Update cache
        setMarketAddressCache(prev => ({
          ...prev,
          [kolId]: marketAddress
        }));
        return marketAddress;
      }
    } catch (err) {
      console.error(`Error fetching market address for KOL ${kolId}:`, err);
    }

    return null;
  }, [kols, marketAddressCache]);

  // Get order details from market contract
  const getOrderDetails = useCallback(async (
    marketAddress: `0x${string}`,
    orderId: number
  ): Promise<Partial<UserOrder> | null> => {
    try {
      const orderDetails = await readContract(config, {
        abi: obAbi,
        address: marketAddress,
        functionName: "getOrderDetails",
        args: [BigInt(orderId)],
      }) as readonly [
        string,    // trader address
        string,    // kolId
        boolean,   // isLong
        bigint,    // mindshareValue
        bigint,    // quantity
        bigint,    // filledQuantity
        number    // status
      ];



      if (!orderDetails) return null;

      // Extract relevant fields from order details
      return {
        filledQuantity: Number(orderDetails[5]) / 1e6, // Convert from wei
        status: Number(orderDetails[6]), // 0: Open, 1: Filled, 2: Cancelled
      };
    } catch (err) {
      console.error(`Error fetching order details for order ${orderId} on market ${marketAddress}:`, err);
      return null;
    }
  }, []);

  // Fetch user orders from subgraph
  const fetchUserOrders = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);

    try {
      // Fetch order events from subgraph
      const { data } = await apolloClient.query({
        query: USER_ORDERS_QUERY,
        variables: {
          user: address.toLowerCase(),
        },
        fetchPolicy: "network-only",
      });

      // Process order created events
      const orderPromises = data.orderCreateds.map(async (event: OrderCreatedEvent) => {
        const marketAddress = await getMarketAddress(event.kolId);
        if (!marketAddress) return null;

        const orderId = Number(event.orderId);
        const orderDetails = await getOrderDetails(marketAddress, orderId);
        
        if (!orderDetails) return null;
        console.log("timeStamp:",event.blockTimestamp)

        return {
          id: orderId,
          trader: event.trader,
          positionId: orderId, // Same as orderId for now
          kolId: event.kolId,
          isLong: event.isLong,
          mindshareValue: Number(event.mindshareValue) / 1e18,
          quantity: Number(event.quantity) / 1e6,
          timestamp: Number(event.blockTimestamp),
          marketAddress,
          ...orderDetails,
        } as UserOrder;
      });

      // Wait for all order details to be fetched
      const fetchedOrders = (await Promise.all(orderPromises)).filter(Boolean) as UserOrder[];
      
      // Set orders
      setOrders(fetchedOrders);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching user orders:", err);
      setError("Failed to fetch orders. Please try again.");
      setLoading(false);
    }
  }, [address, getMarketAddress, getOrderDetails]);

  // Fetch orders when address changes
  useEffect(() => {
    fetchUserOrders();
    
    // Set up polling for updates
    const intervalId = setInterval(fetchUserOrders, 30000); // Poll every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [address, fetchUserOrders]);

  return {
    orders,
    loading,
    error,
    refreshOrders: fetchUserOrders,
    openOrdersCount: orders.length,
  };
} 