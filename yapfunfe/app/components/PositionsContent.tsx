"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, X } from "lucide-react";
import { motion } from "framer-motion";
import { useOrders, Order } from "../hooks/useOrders";
import { Skeleton } from "@/components/ui/skeleton";

function PositionCard({
  order,
  index,
  onCancel,
}: {
  order: Order;
  index: number;
  onCancel: (orderId: number) => void;
}) {
  const fillPercentage = (order.filledQuantity / order.quantity) * 100;
  const isPartiallyFilled = fillPercentage > 0 && fillPercentage < 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="h-full"
    >
      <Card className="position-card p-4 sm:p-6 bg-gradient-to-br from-gray-900/80 via-gray-800/90 to-gray-900/80 border-gray-700/50 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 h-full rounded-2xl backdrop-blur-lg group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4">
          <div>
            <div className="font-medium text-base sm:text-lg font-['Orbitron'] bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent group-hover:from-purple-200 group-hover:via-pink-200 group-hover:to-purple-200 transition-all duration-500">
              Order #{order.id}
            </div>
            <div className="text-xs sm:text-sm text-gray-400/80 font-['Space_Grotesk']">
              KOL ID: {order.kolId}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={order.isLong ? "default" : "destructive"}
              className="self-start sm:self-center text-xs px-3 py-1.5 font-['Space_Grotesk'] tracking-wider rounded-xl"
            >
              {order.isLong ? "LONG" : "SHORT"}
            </Badge>
            {order.status === 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onCancel(order.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm mt-6">
          <div className="space-y-1">
            <div className="text-gray-400/60 text-[10px] sm:text-xs uppercase tracking-[0.2em] font-['Space_Grotesk'] mb-1">
              Mindshare Value
            </div>
            <div className="font-medium text-base sm:text-lg font-['Space_Grotesk'] text-white/90">
              {order.mindshareValue.toFixed(4)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-gray-400/80 text-xs sm:text-sm uppercase tracking-wider">
              Status
            </div>
            <div className="font-medium text-base sm:text-lg font-['Space_Grotesk']">
              {order.status === 0
                ? isPartiallyFilled
                  ? "Partially Filled"
                  : "Open"
                : order.status === 1
                ? "Filled"
                : "Cancelled"}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-gray-400/80 text-xs sm:text-sm uppercase tracking-wider">
              Quantity
            </div>
            <div className="font-medium text-base sm:text-lg font-['Space_Grotesk']">
              {order.quantity.toLocaleString()}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-gray-400/80 text-xs sm:text-sm uppercase tracking-wider">
              Filled
            </div>
            <div className="font-medium text-base sm:text-lg font-['Space_Grotesk']">
              {fillPercentage.toFixed(1)}%
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function PositionsContent() {
  const { orders, loading, error, cancelOrder } = useOrders();
  const [activeTab, setActiveTab] = useState("open");

  const openOrders = orders.filter((order) => order.status === 0);
  const partiallyFilledOrders = orders.filter(
    (order) =>
      order.status === 0 &&
      order.filledQuantity > 0 &&
      order.filledQuantity < order.quantity
  );
  const closedOrders = orders.filter((order) => order.status > 0);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[200px] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500">Error loading orders: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full sm:w-auto flex justify-center mx-auto mb-8 rounded-2xl bg-gray-800/30 p-1 backdrop-blur-lg border border-gray-700/50">
          <TabsTrigger
            value="open"
            className="flex-1 sm:flex-none sm:min-w-[140px] rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 font-['Space_Grotesk'] tracking-wide"
          >
            Open Orders ({openOrders.length})
          </TabsTrigger>
          <TabsTrigger
            value="partial"
            className="flex-1 sm:flex-none sm:min-w-[140px] rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500/20 data-[state=active]:to-orange-500/20 font-['Space_Grotesk'] tracking-wide"
          >
            Partially Filled ({partiallyFilledOrders.length})
          </TabsTrigger>
          <TabsTrigger
            value="closed"
            className="flex-1 sm:flex-none sm:min-w-[140px] rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/20 data-[state=active]:to-red-500/20 font-['Space_Grotesk'] tracking-wide"
          >
            Closed ({closedOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {openOrders.map((order, index) => (
              <PositionCard
                key={order.id}
                order={order}
                index={index}
                onCancel={cancelOrder}
              />
            ))}
            {openOrders.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-500">No open orders</div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="partial" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {partiallyFilledOrders.map((order, index) => (
              <PositionCard
                key={order.id}
                order={order}
                index={index}
                onCancel={cancelOrder}
              />
            ))}
            {partiallyFilledOrders.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-500">No partially filled orders</div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="closed" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {closedOrders.map((order, index) => (
              <PositionCard
                key={order.id}
                order={order}
                index={index}
                onCancel={cancelOrder}
              />
            ))}
            {closedOrders.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-500">No closed orders</div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
