"use client";

import { useEffect, useMemo, useState } from "react";
import { useUserOrders, UserOrder } from "../hooks/useUserOrders";
import { useKOLData } from "../hooks/useKOLData";
import { Card } from "../components/ui/card";
import { motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { writeContract, simulateContract } from "@wagmi/core";
import { config } from "../providers/Web3Providers";
import { obAbi } from "@/contractAbi/orderBook";
import { toast } from "../components/ui/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

interface OrderWithKOL extends UserOrder {
  kolName: string;
  kolHandle: string;
}

const PositionsContent = () => {
  const { kols, loading: kolsLoading } = useKOLData({ timeFilter: "7d" });
  const { orders, loading, error, refreshOrders } = useUserOrders();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<OrderWithKOL | null>(
    null
  );
  const [cancelStatus, setCancelStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [activeTab, setActiveTab] = useState<"filled" | "unfilled">("filled");

  // Memoize filtered orders to prevent unnecessary re-renders
  const activeOrders = useMemo((): OrderWithKOL[] => {
    return orders.map((order: UserOrder): OrderWithKOL => {
      const kol = kols.find((k) => k.user_id === order.kolId);
      return {
        ...order,
        kolName: kol?.name || "Unknown KOL",
        kolHandle: kol?.handle || order.kolId,
      };
    });
  }, [orders, kols]);

  // Separate orders by status
  const filledOrders = useMemo(() => {
    return activeOrders.filter((order) => order.status === 1); // FILLED
  }, [activeOrders]);

  const unfilledOrders = useMemo(() => {
    return activeOrders.filter(
      (order) => order.status === 0 || order.status === 2
    ); // ACTIVE or PARTIAL_FILLED
  }, [activeOrders]);

  function formatLargeNumber(num: number) {
    // For USDC values, we need to handle the 1e6 precision
    // If the number is very small (like 1e-9), it's likely in a different unit
    if (num < 0.000001) {
      // Convert from wei-like precision to USDC (assuming 1e6 precision for USDC)
      const usdcValue = num * 1e6;
      return usdcValue.toFixed(2);
    }

    // If the number is less than 1, show 4 decimal places
    if (num < 1) {
      return num.toFixed(4);
    }

    // If the number is less than 1000, show 2 decimal places
    if (num < 1000) {
      return num.toFixed(2);
    }

    // For larger numbers, format with commas
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    }).format(num);
  }

  // Function to handle order cancellation
  const handleCancelOrder = async (order: OrderWithKOL) => {
    setCancellingOrder(order);
    setCancelModalOpen(true);
    setCancelStatus("loading");

    try {
      const { request } = await simulateContract(config, {
        abi: obAbi,
        address: order.marketAddress,
        functionName: "cancelOrder",
        args: [BigInt(order.id)],
      });

      await writeContract(config, request);
      setCancelStatus("success");

      // Refresh orders after a short delay
      setTimeout(() => {
        refreshOrders();
      }, 2000);
    } catch (err) {
      console.error("Error cancelling order:", err);
      setCancelStatus("error");
    }
  };

  // Function to close the modal and reset state
  const handleCloseModal = () => {
    setCancelModalOpen(false);
    setTimeout(() => {
      setCancellingOrder(null);
      setCancelStatus("idle");
    }, 300);
  };

  // Check if an order can be cancelled (status 0 or 2)
  const canCancelOrder = (order: UserOrder) => {
    return order.status === 0 || order.status === 2; // ACTIVE or PARTIAL_FILLED
  };

  if (loading || kolsLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        Error loading positions: {error}
      </div>
    );
  }

  if (activeOrders.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No open positions found.
      </div>
    );
  }

  // Render order card
  const renderOrderCard = (order: OrderWithKOL, index: number) => (
    <motion.div
      key={order.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{
        scale: 1.03,
        y: -5,
        transition: { duration: 0.2 },
      }}
    >
      <Card
        className={`p-4 transition-all duration-300 border border-secondary/20 bg-card/50 backdrop-blur-sm
          ${
            canCancelOrder(order)
              ? "hover:border-amber-500/50 hover:shadow-[0_8px_30px_rgba(245,158,11,0.2)]"
              : "hover:border-primary/50 hover:shadow-[0_8px_30px_rgba(147,51,234,0.2)]"
          }`}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">{order.kolName}</h3>
            <p className="text-sm text-muted-foreground">{order.kolHandle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                order.isLong
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {order.isLong ? "Long" : "Short"}
            </span>
            {canCancelOrder(order) && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                {order.status === 0 ? "Unfilled" : "Partially Filled"}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Position Size</p>
            <p className="font-medium">
              {formatLargeNumber(order.quantity)} USDC
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Entry Price</p>
            <p className="font-medium">
              {(order.mindshareValue * 100).toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Filled</p>
            <p className="font-medium">
              {((order.filledQuantity / order.quantity) * 100).toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Order ID</p>
            <p className="font-medium">#{order.id}</p>
          </div>
        </div>

        {canCancelOrder(order) && (
          <div className="mt-4">
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => handleCancelOrder(order)}
            >
              Cancel Order
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );

  return (
    <>
      <Tabs
        defaultValue="filled"
        className="w-full"
        onValueChange={(value) => setActiveTab(value as "filled" | "unfilled")}
      >
        <div className="flex justify-center mb-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="filled" className="relative">
              Filled Positions
            </TabsTrigger>
            <TabsTrigger value="unfilled" className="relative">
              Unfilled Positions
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="filled" className="mt-0">
          {filledOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-center py-10 text-muted-foreground"
            >
              No filled positions found.
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filledOrders.map((order, index) =>
                renderOrderCard(order, index)
              )}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="unfilled" className="mt-0">
          {unfilledOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-center py-10 text-muted-foreground"
            >
              No unfilled positions found.
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {unfilledOrders.map((order, index) =>
                renderOrderCard(order, index)
              )}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Order Modal */}
      <Dialog open={cancelModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {cancelStatus === "loading" && "Cancelling Order"}
              {cancelStatus === "success" && "Order Cancelled"}
              {cancelStatus === "error" && "Cancellation Failed"}
            </DialogTitle>
            <DialogDescription>
              {cancellingOrder && (
                <span>
                  Order #{cancellingOrder.id} for {cancellingOrder.kolName}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-4">
            {cancelStatus === "loading" && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Processing your cancellation request...</p>
              </div>
            )}

            {cancelStatus === "success" && (
              <div className="flex flex-col items-center gap-2 text-green-600">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p>Your order has been successfully cancelled!</p>
                <p className="text-sm text-muted-foreground">
                  Any remaining funds will be refunded to your wallet.
                </p>
              </div>
            )}

            {cancelStatus === "error" && (
              <div className="flex flex-col items-center gap-2 text-red-600">
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <X className="h-6 w-6" />
                </div>
                <p>Failed to cancel your order.</p>
                <p className="text-sm text-muted-foreground">
                  Please try again or contact support if the issue persists.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              variant={cancelStatus === "loading" ? "ghost" : "default"}
              onClick={handleCloseModal}
              disabled={cancelStatus === "loading"}
            >
              {cancelStatus === "loading" ? "Please wait..." : "Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PositionsContent;
