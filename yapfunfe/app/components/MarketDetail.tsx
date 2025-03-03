"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BookOpen,
  Info,
  RefreshCcw,
  ChevronUp,
  ChevronDown,
  Clock,
  Users,
  BarChart2,
  MessageSquare,
  ExternalLink,
  X,
  DollarSign,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

import {
  readContract,
  simulateContract,
  writeContract,
  getAccount,
} from "@wagmi/core";
import { obAbi, obCA } from "@/contractAbi/orderBook";

import { config } from "../providers/Web3Providers";

import { parseUnits } from "viem";
import { escrowAbi, escrowCA } from "@/contractAbi/escrowAbi";

// Types for order status
type OrderStatus = {
  status: "pending" | "success" | "error" | null;
  message: string;
};

// Types for loading states
type LoadingStates = {
  order: boolean;
  balance: boolean;
  chart: boolean;
};

const account = getAccount(config);

// Custom hook for balance fetching
const useBalance = (address: string | undefined) => {
  const [balance, setBalance] = useState("0.00");
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    if (!address) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await readContract(config, {
        abi: escrowAbi,
        address: escrowCA,
        functionName: "getUserBalance",
        args: [address],
      });
      setBalance((Number(data) / 1e6).toString());
    } catch (err) {
      console.error("Error fetching balance:", err);
      setBalance("0.00");
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return { balance, isLoading, refetch: fetchBalance };
};

// Custom hook for order management
const useOrder = () => {
  const [orderStatus, setOrderStatus] = useState<OrderStatus>({
    status: null,
    message: "",
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  const resetOrder = () => {
    setOrderStatus({ status: null, message: "" });
    setShowConfirmation(false);
  };

  return {
    orderStatus,
    setOrderStatus,
    showConfirmation,
    setShowConfirmation,
    resetOrder,
  };
};

interface MarketDetailProps {
  isOpen: boolean;
  onClose: () => void;
  kol: {
    name: string;
    handle: string;
    avatar: string;
    mindshare: number;
    volume: string;
    participants: number;
    tweetCount: number;
    kolId: string;
    marketAddress?: `0x${string}`;
  };
}

const timeRanges = [
  { label: "1H", value: "1h" },
  { label: "6H", value: "6h" },
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
  { label: "1M", value: "1m" },
  { label: "ALL", value: "all" },
] as const;

// Custom tooltip component for the chart
// Import Recharts types
import { TooltipProps } from "recharts";
import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  type: "long" | "short";
}

const CustomTooltip = ({
  active,
  payload,
  label,
  type,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border p-3 sm:p-4 rounded-lg shadow-lg min-w-[120px] touch-none">
        <p className="text-xs sm:text-sm font-medium mb-1">
          {label &&
            new Date(label).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
            })}
        </p>
        <p className="text-base sm:text-lg font-semibold flex items-center gap-1.5">
          <span className={type === "long" ? "text-green-500" : "text-red-500"}>
            {payload[0]?.value != null
              ? typeof payload[0].value === "number"
                ? `${payload[0].value.toFixed(2)}%`
                : payload[0].value
              : "N/A"}
          </span>
          {type === "long" ? (
            <ChevronUp className="w-4 h-4 text-green-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-red-500" />
          )}
        </p>
      </div>
    );
  }
  return null;
};

// Order book entry component
const OrderBookEntry = ({
  price,
  size,
  total,
  type,
}: {
  price: number;
  size: number;
  total: number;
  type: "buy" | "sell";
}) => {
  const maxTotal = 10000; // Example maximum total for progress bar
  return (
    <div className="relative">
      <div
        className={`absolute inset-0 ${
          type === "buy" ? "bg-green-500/10" : "bg-red-500/10"
        }`}
        style={{ width: `${(total / maxTotal) * 100}%` }}
      />
      <div className="relative grid grid-cols-3 gap-2 sm:gap-4 py-2 sm:py-1.5 text-xs sm:text-sm touch-none select-none">
        <span
          className={`${
            type === "buy" ? "text-green-500" : "text-red-500"
          } font-medium`}
        >
          ${price.toFixed(2)}
        </span>
        <span className="text-right font-medium">{size.toLocaleString()}</span>
        <span className="text-right text-muted-foreground">
          ${total.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

// Generate mock chart data
const generateChartData = (timeRange: string) => {
  const points =
    {
      "1h": 60,
      "6h": 360,
      "1d": 1440,
      "1w": 10080,
      "1m": 43200,
      all: 87600,
    }[timeRange] || 1440;

  const interval =
    {
      "1h": 60000, // 1 minute
      "6h": 360000, // 6 minutes
      "1d": 900000, // 15 minutes
      "1w": 3600000, // 1 hour
      "1m": 14400000, // 4 hours
      all: 28800000, // 8 hours
    }[timeRange] || 900000;

  return Array.from({ length: points }, (_, i) => ({
    time: new Date(Date.now() - (points - i) * interval).toISOString(),
    value: 30 + Math.random() * 20 + Math.sin(i / 10) * 5,
  }));
};

export default function MarketDetail({
  isOpen,
  onClose,
  kol,
}: MarketDetailProps) {
  const [timeRange, setTimeRange] =
    useState<(typeof timeRanges)[number]["value"]>("1d");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"long" | "short">("long");
  const [loading, setLoading] = useState<LoadingStates>({
    order: false,
    balance: true,
    chart: false,
  });
  const [creatorRevenue, setCreatorRevenue] = useState<string>("0.00");
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(true);

  const {
    balance,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useBalance(account.address);
  const {
    orderStatus,
    setOrderStatus,
    showConfirmation,
    setShowConfirmation,
    resetOrder,
  } = useOrder();

  const chartData = useMemo(() => generateChartData(timeRange), [timeRange]);

  // Memoized validation function
  const validateOrder = useCallback(
    (orderAmount: string, currentBalance: string) => {
      if (!orderAmount || Number(orderAmount) <= 0) {
        return { isValid: false, error: "Please enter a valid amount" };
      }
      if (Number(orderAmount) > Number(currentBalance)) {
        return { isValid: false, error: "Insufficient balance" };
      }
      // Add maximum order validation
      if (Number(orderAmount) > 1000000) {
        // Example limit of 1M
        return { isValid: false, error: "Order exceeds maximum limit" };
      }
      return { isValid: true, error: null };
    },
    []
  );

  // Enhanced order placement handler
  const handlePlaceOrder = async () => {
    const validation = validateOrder(amount, balance);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    // Show confirmation for large orders
    if (Number(amount) > 10000) {
      // Example threshold
      if (
        !window.confirm(
          `Are you sure you want to place a ${activeTab} order for $${amount}?`
        )
      ) {
        return;
      }
    }

    setLoading((prev) => ({ ...prev, order: true }));
    setError(null);

    try {
      if (!kol.marketAddress) {
        throw new Error("No market address found for this KOL");
      }

      const { request } = await simulateContract(config, {
        abi: obAbi,
        address: kol.marketAddress,
        functionName: "createOrder",
        args: [activeTab === "long", parseUnits(amount, 6)],
      });

      setOrderStatus({
        status: "pending",
        message: "Processing your order...",
      });
      setShowConfirmation(true);

      const result = await writeContract(config, request);

      setOrderStatus({
        status: "success",
        message: "Order placed successfully!",
      });
      setAmount("");
      refetchBalance(); // Refresh balance after successful order
    } catch (err) {
      console.error("Order placement failed:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to place order";
      setOrderStatus({ status: "error", message: errorMessage });
      setShowConfirmation(true);
    } finally {
      setLoading((prev) => ({ ...prev, order: false }));
    }
  };

  // Memoized order book data
  const orderBookData = useMemo(
    () => ({
      sells: Array.from({ length: 5 }).map((_, i) => ({
        price: 40 - i * 0.5,
        size: Math.floor(Math.random() * 1000),
        total: Math.floor(Math.random() * 10000),
      })),
      buys: Array.from({ length: 5 }).map((_, i) => ({
        price: 39.5 - i * 0.5,
        size: Math.floor(Math.random() * 1000),
        total: Math.floor(Math.random() * 10000),
      })),
    }),
    []
  ); // Empty dependency array as this is mock data

  // Fetch creator revenue
  useEffect(() => {
    const fetchCreatorRevenue = async () => {
      if (!kol.marketAddress) {
        setIsLoadingRevenue(false);
        return;
      }

      try {
        setIsLoadingRevenue(true);
        const totalFeeCollected = await readContract(config, {
          abi: obAbi,
          address: kol.marketAddress,
          functionName: "totalFeeCollected",
          args: [],
        });

        // Creator gets half of the total fee collected
        const creatorFee = Number(totalFeeCollected) / 2 / 1e6;
        setCreatorRevenue(creatorFee.toFixed(2));
      } catch (err) {
        console.error("Error fetching creator revenue:", err);
        setCreatorRevenue("0.00");
      } finally {
        setIsLoadingRevenue(false);
      }
    };

    fetchCreatorRevenue();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCreatorRevenue, 30000);
    return () => clearInterval(interval);
  }, [kol.marketAddress]);

  return (
    <>
      <Dialog
        open={showConfirmation}
        onOpenChange={(open) => {
          if (!open) resetOrder();
        }}
      >
        <DialogContent className="sm:max-w-md mx-4 sm:mx-auto rounded-xl">
          <DialogTitle>
            {orderStatus.status === "pending"
              ? "Processing Order"
              : orderStatus.status === "success"
              ? "Order Confirmed"
              : "Order Failed"}
          </DialogTitle>
          <DialogDescription className="space-y-4 rounded-xl">
            <div className="flex items-center gap-3 mt-2">
              {orderStatus.status === "pending" ? (
                <RefreshCcw className="w-5 h-5 animate-spin text-primary" />
              ) : orderStatus.status === "success" ? (
                <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-4 h-4 stroke-current stroke-2"
                    aria-hidden="true"
                  >
                    <path
                      d="M20 6L9 17L4 12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-4 h-4 stroke-current stroke-2"
                    aria-hidden="true"
                  >
                    <path
                      d="M18 6L6 18M6 6L18 18"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
              <p role="status">{orderStatus.message}</p>
            </div>
          </DialogDescription>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowConfirmation(false);
                setOrderStatus({ status: null, message: "" });
                if (orderStatus.status === "success") {
                  onClose();
                }
              }}
              className="rounded-xl"
            >
              {orderStatus.status === "success" ? "Close" : "Dismiss"}
            </Button>
            {orderStatus.status === "error" && (
              <Button
                onClick={() => {
                  setShowConfirmation(false);
                  setOrderStatus({ status: null, message: "" });
                }}
                className="bg-red-500 hover:bg-red-600"
              >
                Try Again
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl w-[95vw] sm:w-full p-0 bg-background gap-0 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto  sm:mx-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-4 sm:p-6 space-y-4 sm:space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10 pb-2">
              <div className="flex items-center space-x-4">
                <img
                  src={kol.avatar || "/placeholder.svg"}
                  alt={`${kol.name}'s avatar`}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full ring-2 ring-border"
                />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    {kol.name}
                    <a
                      href={`https://twitter.com/${kol.handle.slice(1)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                      aria-label={`Visit ${kol.name}'s Twitter profile`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </h2>
                  <p className="text-sm text-muted-foreground">{kol.handle}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.location.reload()}
                  aria-label="Refresh data"
                >
                  <RefreshCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Show information"
                >
                  <Info className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Chart Section */}
              <div className="md:col-span-2 space-y-4 sm:space-y-6">
                <Card className="p-4 sm:p-5 rounded-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
                    <div className="space-y-1">
                      <div className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                        {kol.mindshare}%
                        <span
                          className={
                            activeTab === "long"
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        >
                          {activeTab === "long" ? (
                            <ChevronUp
                              className="w-5 h-5"
                              aria-label="Trending up"
                            />
                          ) : (
                            <ChevronDown
                              className="w-5 h-5"
                              aria-label="Trending down"
                            />
                          )}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        Last updated: {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
                      {timeRanges.map((range) => (
                        <Button
                          key={range.value}
                          variant={
                            timeRange === range.value ? "secondary" : "ghost"
                          }
                          size="sm"
                          onClick={() => setTimeRange(range.value)}
                          className="text-[10px] sm:text-xs h-8 sm:h-9 px-2 sm:px-3 flex-1 sm:flex-none rounded-xl min-w-[40px]"
                          aria-label={`Show ${range.label} chart`}
                        >
                          {range.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="h-[30vh] sm:h-[35vh] min-h-[180px] sm:min-h-[250px] max-h-[400px] -mx-2 sm:mx-0 touch-pan-y">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.1)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="time"
                          tickFormatter={(time) => {
                            const date = new Date(time);
                            return timeRange === "1h"
                              ? date.toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : date.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                });
                          }}
                          stroke="#666"
                          fontSize={8}
                          height={20}
                          dy={5}
                          tickMargin={8}
                        />
                        <YAxis
                          stroke="#666"
                          fontSize={8}
                          tickFormatter={(value) => `${value}%`}
                          width={30}
                          tickMargin={4}
                        />
                        <Tooltip
                          content={(props) => (
                            <CustomTooltip {...props} type={activeTab} />
                          )}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={activeTab === "long" ? "#22c55e" : "#ef4444"}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6 }}
                          style={{ touchAction: "pan-y pinch-zoom" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Market Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <Card className="p-3 sm:p-4 rounded-xl">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground mb-2 sm:mb-3">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">24h Volume</span>
                    </div>
                    <div className="text-base sm:text-lg font-semibold">
                      {kol.volume}
                    </div>
                  </Card>
                  <Card className="p-3 sm:p-4 rounded-xl">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground mb-2 sm:mb-3">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">Participants</span>
                    </div>
                    <div className="text-base sm:text-lg font-semibold">
                      {kol.participants}
                    </div>
                  </Card>
                  <Card className="p-3 sm:p-4 rounded-xl">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground mb-2 sm:mb-3">
                      <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">Tweet Count</span>
                    </div>
                    <div className="text-base sm:text-lg font-semibold">
                      {kol.tweetCount}
                    </div>
                  </Card>
                  <Card className="p-3 sm:p-4 rounded-xl">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground mb-2 sm:mb-3">
                      <BarChart2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">Price Range</span>
                    </div>
                    <div className="text-base sm:text-lg font-semibold">
                      30% - 70%
                    </div>
                  </Card>
                </div>
              </div>

              {/* Trading Interface */}
              <div className="space-y-3 sm:space-y-4">
                {/* Creator Revenue Card */}
                <Card className="overflow-hidden rounded-xl relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 animate-gradient-slow"></div>

                  {/* Sparkle effects */}
                  <div className="absolute top-3 right-8 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse-glow"></div>
                  <div
                    className="absolute top-12 right-4 w-1 h-1 bg-purple-400 rounded-full animate-pulse-glow"
                    style={{ animationDelay: "0.5s" }}
                  ></div>
                  <div
                    className="absolute bottom-6 right-10 w-1 h-1 bg-pink-400 rounded-full animate-pulse-glow"
                    style={{ animationDelay: "1s" }}
                  ></div>
                  <div
                    className="absolute bottom-10 left-8 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse-glow"
                    style={{ animationDelay: "1.5s" }}
                  ></div>

                  {/* Hover effect border */}
                  <div className="absolute inset-0 border border-transparent group-hover:border-purple-500/50 rounded-xl transition-colors duration-300"></div>

                  <div className="relative p-3 sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-1.5 rounded-lg shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow duration-300">
                          <DollarSign className="w-4 h-4 text-white animate-float" />
                        </div>
                        <h3 className="font-bold text-sm sm:text-base bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-transparent bg-clip-text">
                          KOL Feeshare
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse-glow" />
                        <span className="text-xs text-amber-200">Accruing</span>
                      </div>
                    </div>

                    <div className="mt-2 sm:mt-3">
                      {isLoadingRevenue ? (
                        <div className="flex items-center gap-2 h-10">
                          <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
                          <span className="text-muted-foreground text-sm">
                            Loading revenue data...
                          </span>
                        </div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-2"
                        >
                          <div className="flex items-end gap-1">
                            <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-transparent bg-clip-text group-hover:from-purple-400 group-hover:via-pink-400 group-hover:to-orange-400 transition-all duration-300">
                              ${creatorRevenue}
                            </span>
                            <div className="flex items-center gap-1 bg-green-500/10 px-1.5 py-0.5 rounded-md mb-1.5">
                              <TrendingUp className="w-3 h-3 text-green-500" />
                              <span className="text-[10px] text-green-500 font-medium">
                                Earning
                              </span>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Revenue accrued from market activity
                          </p>
                        </motion.div>
                      )}
                    </div>

                    <div className="mt-3 sm:mt-4">
                      <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 relative"
                          initial={{ width: "0%" }}
                          animate={{
                            width: `${Math.min(
                              Number(creatorRevenue) / 10,
                              100
                            )}%`,
                          }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        >
                          {/* Animated shine effect */}
                          <div
                            className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-gradient-slow"
                            style={{ backgroundSize: "200% 100%" }}
                          ></div>
                        </motion.div>
                      </div>
                      <div className="flex justify-between mt-1.5 text-[10px] sm:text-xs text-muted-foreground">
                        <span>0</span>
                        <span className="flex items-center gap-1">
                          <span>Growing with market activity</span>
                          <motion.div
                            animate={{
                              scale: [1, 1.2, 1],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 2,
                              repeatDelay: 1,
                            }}
                          >
                            <Sparkles className="w-3 h-3 text-amber-400" />
                          </motion.div>
                        </span>
                      </div>
                    </div>

                    {/* New tooltip section */}
                    <div className="mt-3 pt-3 border-t border-border/50 text-[10px] sm:text-xs text-muted-foreground flex items-center justify-between">
                      <span>50% of all trading fees</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] sm:text-xs px-2 hover:bg-purple-500/10 hover:text-purple-400"
                      >
                        Learn more
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card className="p-3 sm:p-5 rounded-xl">
                  <Tabs
                    value={activeTab}
                    onValueChange={(value: string) =>
                      setActiveTab(value as "long" | "short")
                    }
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 rounded-xl h-12">
                      <TabsTrigger
                        className="rounded-xl text-sm sm:text-base"
                        value="long"
                      >
                        Long
                      </TabsTrigger>
                      <TabsTrigger
                        className="rounded-xl text-sm sm:text-base"
                        value="short"
                      >
                        Short
                      </TabsTrigger>
                    </TabsList>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm mb-1">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="text-muted-foreground flex items-center gap-1">
                            Balance:{" "}
                            {isLoadingBalance ? (
                              <RefreshCcw className="w-3 h-3 animate-spin" />
                            ) : (
                              <span className="font-medium">${balance}</span>
                            )}
                          </span>
                        </div>
                        <div className="flex space-x-2 relative">
                          <Input
                            type="number"
                            inputMode="decimal"
                            pattern="[0-9]*"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="flex-1 rounded-xl text-sm sm:text-base h-10 sm:h-12 px-3 sm:px-4 touch-manipulation"
                            min="0"
                            step="0.01"
                            aria-label="Enter amount"
                          />
                          <Button
                            className="rounded-xl h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base whitespace-nowrap"
                            variant="outline"
                            onClick={() => setAmount(balance)}
                            disabled={isLoadingBalance}
                          >
                            Max
                          </Button>
                        </div>
                      </div>
                      {error && (
                        <p
                          className="text-red-500 text-xs sm:text-sm mt-1 sm:mt-2"
                          role="alert"
                        >
                          {error}
                        </p>
                      )}
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-2 sm:mt-4">
                        {[25, 50, 75, 100].map((percent) => (
                          <Button
                            key={percent}
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setAmount(
                                (Number(balance) * (percent / 100)).toFixed(2)
                              )
                            }
                            className="text-xs sm:text-sm rounded-xl h-8 sm:h-10 px-1 sm:px-2"
                            disabled={isLoadingBalance}
                            aria-label={`Set amount to ${percent}% of balance`}
                          >
                            {percent}%
                          </Button>
                        ))}
                      </div>
                      <Button
                        className={`w-full h-12 text-sm sm:text-base font-medium ${
                          activeTab === "long"
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-red-500 hover:bg-red-600"
                        } rounded-xl mt-2 sm:mt-4`}
                        disabled={loading.order || isLoadingBalance}
                        onClick={handlePlaceOrder}
                      >
                        {loading.order ? (
                          <div className="flex items-center gap-2">
                            <RefreshCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                            Processing...
                          </div>
                        ) : (
                          `Place ${activeTab === "long" ? "Long" : "Short"}`
                        )}
                      </Button>
                    </div>
                  </Tabs>
                </Card>

                <Card className="p-3 sm:p-5 rounded-xl">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <h3 className="font-semibold text-xs sm:text-sm">
                        Order Book
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs sm:text-sm h-8 hover:bg-background/10"
                      onClick={() => {
                        setLoading((prev) => ({ ...prev, order: true }));
                        // Simulate refresh delay
                        setTimeout(() => {
                          setLoading((prev) => ({ ...prev, order: false }));
                        }, 1000);
                      }}
                      disabled={loading.order}
                    >
                      {loading.order ? (
                        <RefreshCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 animate-spin" />
                      ) : (
                        <RefreshCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                      )}
                      Refresh
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground mb-2 px-1.5 sm:px-2">
                      <span>Price</span>
                      <span className="text-right">Size</span>
                      <span className="text-right">Total</span>
                    </div>
                    <div className="space-y-1 sm:space-y-1.5 max-h-[180px] sm:max-h-[300px] overflow-y-auto overscroll-contain touch-pan-y scrollbar-thin scrollbar-thumb-border scrollbar-track-background">
                      {orderBookData.sells.map((entry, i) => (
                        <OrderBookEntry
                          key={`sell-${i}`}
                          price={entry.price}
                          size={entry.size}
                          total={entry.total}
                          type="sell"
                        />
                      ))}
                      <div className="text-center py-3 font-medium border-y border-border my-2 text-sm sm:text-base bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                        {kol.mindshare.toFixed(2)}%
                      </div>
                      {orderBookData.buys.map((entry, i) => (
                        <OrderBookEntry
                          key={`buy-${i}`}
                          price={entry.price}
                          size={entry.size}
                          total={entry.total}
                          type="buy"
                        />
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}
