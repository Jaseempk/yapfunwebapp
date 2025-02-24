"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccount, useBalance } from "wagmi";
import PositionsContent from "./PositionsContent";
import DepositModal from "./DepositModal";
import { motion } from "framer-motion";
import { Sparkles, Wallet, TrendingUp, BarChart2 } from "lucide-react";
import {
  readContract,
  simulateContract,
  writeContract,
  getAccount,
} from "@wagmi/core";
import { erc20Abi } from "viem";
import { config } from "../providers/Web3Providers";
import { escrowAbi, escrowCA } from "@/contractAbi/escrowAbi";
export default function ProfileContent() {
  const { address } = useAccount();
  const { data: balance } = useBalance({
    address,
  });
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [inHouseBalance, setInHouseBalance] = useState("100.00"); // TODO: Replace with actual balance fetch
  const [userBalance, setUserBalance] = useState("00.00"); // TODO: Replace with actual balance fetch
  const usdcAddress = "0xC129124eA2Fd4D63C1Fc64059456D8f231eBbed1";

  const account = getAccount(config);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!account.address) return;
      try {
        const data = await readContract(config, {
          abi: escrowAbi,
          address: escrowCA,
          functionName: "getUserBalance",
          args: [account.address],
        });
        setInHouseBalance((Number(data) / 1e6).toString());
      } catch (err) {
        console.error("Error fetching balance:", err);
        setInHouseBalance("0.00");
      }
    };
    const fetchUserbalance = async () => {
      if (!account.address) return;
      try {
        const data = await readContract(config, {
          abi: erc20Abi,
          address: usdcAddress,
          functionName: "balanceOf",
          args: [account.address],
        });
        setUserBalance((Number(data) / 1e6).toString());
      } catch (err) {
        console.error("Error fetching balance:", err);
        setUserBalance("0.00");
      }
    };

    fetchUserbalance();
    const fetchUserBalance = fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [account.address]);

  const handleDeposit = async (
    amount: string
  ): Promise<{ success: boolean; message: string }> => {
    // TODO: Implement actual deposit logic
    return new Promise((resolve) => {
      setTimeout(async () => {
        // Simulating a successful deposit
        if (!account.address) return;
        const data = await readContract(config, {
          abi: erc20Abi,
          address: usdcAddress,
          functionName: "balanceOf",
          args: [account.address],
        });
        setInHouseBalance(data.toString());
        resolve({ success: true, message: "Deposit successful!" });
      }, 2000);
    });
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
              <Button
                onClick={() => setIsDepositModalOpen(true)}
                className="mt-4 bg-white/90 text-blue-600 hover:bg-white hover:text-blue-700 transition-colors rounded-xl"
                size="sm"
              >
                Deposit
              </Button>
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
              <p className="text-2xl sm:text-3xl font-bold mt-auto">
                +$1,234.56
              </p>
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
              <p className="text-2xl sm:text-3xl font-bold mt-auto">5</p>
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
        maxAmount={balance?.formatted || "0"}
      />
    </div>
  );
}
