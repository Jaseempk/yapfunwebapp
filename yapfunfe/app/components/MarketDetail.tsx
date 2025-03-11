"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { Particles } from "react-tsparticles";
import { loadFull } from "tsparticles";
import { readContract } from "@wagmi/core";
import { obAbi } from "@/contractAbi/orderBook";
import { config } from "../providers/Web3Providers";
import { useBalances } from "../hooks/useBalances";
import { X } from "lucide-react";

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

// Floating animation variants for cards
const floatingAnimation = {
  initial: { y: 0 },
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 3,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "reverse" as const,
    },
  },
};

// Staggered entrance animation for cards
const containerAnimation = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemAnimation = {
  hidden: { y: 20, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

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
  const [particlesLoaded, setParticlesLoaded] = useState(false);

  // Initialize particles
  const particlesInit = async (engine: any) => {
    await loadFull(engine);
  };

  const handleParticlesLoaded = async (container?: any) => {
    setParticlesLoaded(true);
    return Promise.resolve();
  };
  const [orderStatus, setOrderStatus] = useState<OrderStatus>({
    status: null,
    message: "",
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { address } = useAccount();
  const {
    inHouseBalance: balance,
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
        <DialogContent
          className="max-w-5xl w-[95vw] sm:w-full p-0 bg-background/95 backdrop-blur-sm gap-0 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto sm:mx-4 border border-border/50 shadow-xl"
          hideCloseButton
        >
          <DialogTitle className="sr-only">
            {kol.name} Market Details
          </DialogTitle>
          <DialogDescription className="sr-only">
            Market details and trading interface for {kol.name} ({kol.handle})
          </DialogDescription>

          {/* Ambient background particles */}
          <div className="absolute inset-0 z-0 opacity-40 pointer-events-none overflow-hidden">
            <Particles
              id="tsparticles"
              init={particlesInit}
              loaded={handleParticlesLoaded}
              options={{
                fullScreen: { enable: false },
                fpsLimit: 60,
                particles: {
                  color: { value: "#ffffff" },
                  links: {
                    color: "#ffffff",
                    distance: 150,
                    enable: true,
                    opacity: 0.2,
                    width: 1,
                  },
                  move: {
                    enable: true,
                    outModes: { default: "bounce" },
                    random: true,
                    speed: 0.5,
                    direction: "none",
                  },
                  number: { density: { enable: true, area: 800 }, value: 30 },
                  opacity: { value: 0.2 },
                  shape: { type: "circle" },
                  size: { value: { min: 1, max: 3 } },
                },
                detectRetina: true,
              }}
            />
          </div>

          <div className="absolute right-3 top-3 z-50">
            <DialogClose className="rounded-full p-2 bg-background/80 backdrop-blur-sm opacity-70 ring-offset-background transition-all duration-200 hover:opacity-100 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="p-4 sm:p-6 space-y-4 sm:space-y-6 relative z-10"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <MarketHeader
                name={kol.name}
                handle={kol.handle}
                avatar={kol.avatar}
                marketAddress={kol.marketAddress}
                startTime={kol.startTime}
                onRefresh={() => window.location.reload()}
              />
            </motion.div>

            {/* Chart Section - Always at the top for all screen sizes */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              className="transform-gpu"
            >
              <MarketChart
                mindshare={kol.mindshare}
                timeRange={timeRange}
                activeTab={activeTab}
                onTimeRangeChange={setTimeRange}
                className="mb-4 sm:mb-6 hover:ring-1 hover:ring-primary/20 transition-all duration-300"
              />
            </motion.div>

            {/* Trading Cards Row - On mobile: stacked vertically, On desktop: horizontal row */}
            <motion.div
              variants={containerAnimation}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6"
            >
              {/* Trading Interface */}
              <motion.div
                className="order-1 transform-gpu"
                variants={itemAnimation}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                animate={floatingAnimation.animate}
              >
                <TradingInterface
                  marketAddress={kol.marketAddress}
                  balance={balance}
                  isLoadingBalance={isLoadingBalance}
                  onOrderSuccess={handleOrderSuccess}
                  onBalanceRefresh={refetchBalance}
                />
              </motion.div>

              {/* Order Book Section */}
              <motion.div
                className="order-2 transform-gpu"
                variants={itemAnimation}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                animate={{
                  ...floatingAnimation.animate,
                  transition: {
                    ...floatingAnimation.animate.transition,
                    delay: 0.5,
                  },
                }}
              >
                <OrderBookSection
                  marketAddress={kol.marketAddress}
                  currentMindshare={kol.mindshare}
                />
              </motion.div>

              {/* Creator Revenue */}
              <motion.div
                className="order-3 transform-gpu"
                variants={itemAnimation}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                animate={{
                  ...floatingAnimation.animate,
                  transition: {
                    ...floatingAnimation.animate.transition,
                    delay: 1,
                  },
                }}
              >
                <CreatorRevenue
                  revenue={creatorRevenue}
                  isLoading={isLoadingRevenue}
                />
              </motion.div>
            </motion.div>

            {/* Market Stats - Full width row at the bottom */}
            <motion.div
              className="order-4 transform-gpu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
            >
              <MarketStats
                volume={kol.volume}
                participants={kol.participants}
                tweetCount={kol.tweetCount}
                priceRange={{ min: 30, max: 70 }}
              />
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}
