"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import PositionsContent from "./PositionsContent";
import { useOrders } from "../hooks/useOrders";
import { useBalances } from "../hooks/useBalances";
import { useDeposit } from "../hooks/useDeposit";
import { usePnL } from "../hooks/usePnL";
import DepositModal from "./DepositModal";
import WithdrawModal from "./WithdrawModal";
import { motion } from "framer-motion";
import { Sparkles, Wallet, TrendingUp, BarChart2, Loader2 } from "lucide-react";
export default function ProfileContent() {
  const { address } = useAccount();
  const { orders } = useOrders();
  const { inHouseBalance, userBalance, refreshBalances } = useBalances();
  const openOrdersCount = orders.filter((order) => order.status === 0).length;
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const { deposit, loading: depositLoading } = useDeposit();
  const {
    loading: pnlLoading,
    error: pnlError,
    isPositive,
    formattedPnL,
  } = usePnL();

  const handleDeposit = async (
    amount: string
  ): Promise<{ success: boolean; message: string }> => {
    const result = await deposit(amount);
    if (result.success) {
      await refreshBalances();
    }
    return result;
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
      <motion.h1
        className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Degen Dashboard
      </motion.h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="h-full"
        >
          <Card className="bg-gradient-to-br from-green-400 to-blue-500 text-white rounded-xl h-full hover:shadow-lg hover:shadow-green-500/20 transform hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-4 sm:p-6 flex flex-col h-full">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" />
              <h2 className="text-lg sm:text-2xl font-semibold mb-2">
                In-house Balance
              </h2>
              <p className="text-2xl sm:text-3xl font-bold">
                {inHouseBalance} USDC
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => setIsDepositModalOpen(true)}
                  className="bg-white/90 text-blue-600 hover:bg-white hover:text-blue-700 transition-colors rounded-xl"
                  size="sm"
                  disabled={depositLoading}
                >
                  {depositLoading ? "Depositing..." : "Deposit"}
                </Button>
                <Button
                  onClick={() => setIsWithdrawModalOpen(true)}
                  className="bg-white/90 text-blue-600 hover:bg-white hover:text-blue-700 transition-colors rounded-xl"
                  size="sm"
                >
                  Withdraw
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl h-full hover:shadow-lg hover:shadow-blue-500/20 transform hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-4 sm:p-6 flex flex-col h-full">
              <Wallet className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" />
              <h2 className="text-lg sm:text-2xl font-semibold mb-2">
                Wallet Balance
              </h2>

              <p className="text-2xl sm:text-3xl font-bold mt-auto">
                {Math.floor(Number(userBalance))} USDC
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="h-full"
        >
          <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-xl h-full hover:shadow-lg hover:shadow-yellow-500/20 transform hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-4 sm:p-6 flex flex-col h-full">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" />
              <h2 className="text-lg sm:text-2xl font-semibold mb-2">
                Total PnL
              </h2>
              {pnlLoading ? (
                <div className="flex items-center gap-2 text-2xl sm:text-3xl font-bold mt-auto">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Calculating...</span>
                </div>
              ) : pnlError ? (
                <p className="text-2xl sm:text-3xl font-bold mt-auto text-red-400">
                  Error loading PnL
                </p>
              ) : (
                <p
                  className={`text-2xl sm:text-3xl font-bold mt-auto ${
                    isPositive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {formattedPnL}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="h-full"
        >
          <Card className="bg-gradient-to-br from-pink-500 to-red-600 text-white rounded-xl h-full hover:shadow-lg hover:shadow-pink-500/20 transform hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-4 sm:p-6 flex flex-col h-full">
              <BarChart2 className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" />
              <h2 className="text-lg sm:text-2xl font-semibold mb-2">
                Open Positions
              </h2>
              <p className="text-2xl sm:text-3xl font-bold mt-auto">
                {openOrdersCount}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        className="mt-8 sm:mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-2xl sm:text-3xl font-['Orbitron'] mb-6 sm:mb-8 text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
          Your Positions
        </h2>
        <PositionsContent />
      </motion.div>

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onDeposit={handleDeposit}
        maxAmount={userBalance}
      />
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        maxAmount={inHouseBalance}
        onSuccess={refreshBalances}
      />
    </div>
  );
}
