"use client";

import { useEffect, useMemo } from "react";
import { useOrders, Order } from "../hooks/useOrders";
import { useKOLData } from "../hooks/useKOLData";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const PositionsContent = () => {
  const { orders, loading: ordersLoading, error: ordersError } = useOrders();
  const { kols, loading: kolsLoading } = useKOLData({ timeFilter: "7d" });

  // Memoize filtered orders to prevent unnecessary re-renders
  const activeOrders = useMemo(() => {
    return orders
      .filter((order) => order.status === 0)
      .map((order) => {
        const kol = kols.find((k) => k.user_id === order.kolId);
        return {
          ...order,
          kolName: kol?.name || "Unknown KOL",
          kolHandle: kol?.handle || order.kolId,
        };
      });
  }, [orders, kols]);

  function formatLargeNumber(num: number) {
    // Convert to a regular number format (not scientific notation)
    const regularFormat = num.toString();

    // Find the decimal point position
    const decimalPos = regularFormat.indexOf(".");

    if (decimalPos === -1) {
      // No decimal point
      return regularFormat;
    } else {
      // Return with 4 digits after decimal
      return regularFormat.slice(0, decimalPos + 5);
    }
  }

  if (ordersLoading || kolsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (ordersError) {
    return (
      <div className="text-center text-red-500 min-h-[200px] flex items-center justify-center">
        Error loading positions
      </div>
    );
  }

  if (activeOrders.length === 0) {
    return (
      <div className="text-center text-gray-500 min-h-[200px] flex items-center justify-center">
        No active positions found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {activeOrders.map((order, index) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="bg-background/50 backdrop-blur-sm hover:bg-background/70 transition-all duration-300 p-4 rounded-xl">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{order.kolName}</h3>
                  <p className="text-sm text-gray-500">@{order.kolHandle}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    order.isLong
                      ? "bg-green-500/10 text-green-500"
                      : "bg-red-500/10 text-red-500"
                  } rounded-xl`}
                >
                  {order.isLong ? "LONG" : "SHORT"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Mindshare Value</p>
                  <p className="font-medium">
                    {formatLargeNumber(order.mindshareValue)}%
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Quantity</p>
                  <p className="font-medium">{order.quantity / 1e6} USDC</p>
                </div>
                <div>
                  <p className="text-gray-500">Filled</p>
                  <p className="font-medium">{order.filledQuantity} USDC</p>
                </div>
                <div>
                  <p className="text-gray-500">Remaining</p>
                  <p className="font-medium">
                    {(order.quantity - order.filledQuantity) / 1e6} USDC
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default PositionsContent;
