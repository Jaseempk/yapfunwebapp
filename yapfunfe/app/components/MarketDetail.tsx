"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { readContract } from "@wagmi/core";
import { obAbi } from "@/contractAbi/orderBook";
import { config } from "../providers/Web3Providers";
import { useBalances } from "../hooks/useBalances";

import MarketHeader from "./market/MarketHeader";
import MarketChart from "./market/MarketChart";
import MarketStats from "./market/MarketStats";
import CreatorRevenue from "./market/CreatorRevenue";
import TradingInterface from "./market/TradingInterface";
import OrderBookSection from "./OrderBookSection";
import OrderConfirmationDialog from "./market/OrderConfirmationDialog";
import MarketEventNotification from "./MarketEventNotification";

const timeRanges = [
  { label: "1H", value: "1h" },
  { label: "6H", value: "6h" },
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
  { label: "1M", value: "1m" },
  { label: "ALL", value: "all" },
] as const;

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
    startTime?: number;
  };
}

interface OrderStatus {
  status: "pending" | "success" | "error" | null;
  message: string;
}

export default function MarketDetail({
  isOpen,
  onClose,
  kol,
}: MarketDetailProps) {
  const [timeRange, setTimeRange] =
    useState<(typeof timeRanges)[number]["value"]>("1h");
  const [activeTab, setActiveTab] = useState<"long" | "short">("long");
  const [creatorRevenue, setCreatorRevenue] = useState<string>("0.00");
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(true);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>({
    status: null,
    message: "",
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { address } = useAccount();
  const {
    userBalance: balance,
    loading: isLoadingBalance,
    refreshBalances: refetchBalance,
  } = useBalances();

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
        const creatorFee = Number(totalFeeCollected) / 2;
        setCreatorRevenue(creatorFee.toFixed(2));
      } catch (err) {
        console.error("Error fetching creator revenue:", err);
        setCreatorRevenue("0.00");
      } finally {
        setIsLoadingRevenue(false);
      }
    };

    fetchCreatorRevenue();
    // Refresh every hour
    const interval = setInterval(fetchCreatorRevenue, 3600000);
    return () => clearInterval(interval);
  }, [kol.marketAddress]);

  const handleOrderSuccess = () => {
    setOrderStatus({
      status: "success",
      message: "Order placed successfully!",
    });
    setShowConfirmation(true);
  };

  const handleOrderError = (error: Error) => {
    setOrderStatus({
      status: "error",
      message: error.message,
    });
    setShowConfirmation(true);
  };

  return (
    <>
      <MarketEventNotification
        marketAddress={kol.marketAddress}
        userAddress={address}
      />

      <OrderConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setOrderStatus({ status: null, message: "" });
          if (orderStatus.status === "success") {
            onClose();
          }
        }}
        orderStatus={orderStatus}
      />

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl w-[95vw] sm:w-full p-0 bg-background gap-0 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto sm:mx-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-4 sm:p-6 space-y-4 sm:space-y-6"
          >
            <MarketHeader
              name={kol.name}
              handle={kol.handle}
              avatar={kol.avatar}
              marketAddress={kol.marketAddress}
              startTime={kol.startTime}
              onRefresh={() => window.location.reload()}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Chart Section */}
              <div className="md:col-span-2 space-y-4 sm:space-y-6">
                <MarketChart
                  mindshare={kol.mindshare}
                  timeRange={timeRange}
                  activeTab={activeTab}
                  onTimeRangeChange={setTimeRange}
                />

                <MarketStats
                  volume={kol.volume}
                  participants={kol.participants}
                  tweetCount={kol.tweetCount}
                  priceRange={{ min: 30, max: 70 }}
                />
              </div>

              {/* Trading Interface */}
              <div className="space-y-3 sm:space-y-4">

                <TradingInterface
                  marketAddress={kol.marketAddress}
                  balance={balance}
                  isLoadingBalance={isLoadingBalance}
                  onOrderSuccess={handleOrderSuccess}
                  onBalanceRefresh={refetchBalance}
                />

                <OrderBookSection
                  marketAddress={kol.marketAddress}
                  currentMindshare={kol.mindshare}
                />
                <CreatorRevenue
                  revenue={creatorRevenue}
                  isLoading={isLoadingRevenue}
                />
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}
