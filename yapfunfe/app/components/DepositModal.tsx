"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertTriangle, Loader2 } from "lucide-react";
import { escrowAbi, escrowCA } from "@/contractAbi/escrowAbi";
import {
  readContract,
  simulateContract,
  writeContract,
  getAccount,
  waitForTransaction,
} from "@wagmi/core";
import { config } from "../providers/Web3Providers";
import { parseUnits, erc20Abi } from "viem";

import { ethers } from "ethers";
import { MaxUint256 } from "@uniswap/permit2-sdk";
import { AllowanceTransfer, PERMIT2_ADDRESS } from "@uniswap/permit2-sdk";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: string) => Promise<{ success: boolean; message: string }>;
  maxAmount: string;
  refreshBalances: () => Promise<void>;
}
const account = getAccount(config);

export default function DepositModal({
  isOpen,
  onClose,
  onDeposit,
  maxAmount,
  refreshBalances,
}: DepositModalProps) {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [balance, setBalance] = useState("0.00");

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
        setBalance((Number(data) / 1e6).toString());
      } catch (err) {
        console.error("Error fetching balance:", err);
        setBalance("0.00");
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [account.address]);

  const usdcAddress = "0xC129124eA2Fd4D63C1Fc64059456D8f231eBbed1";

  const checkAllowance = async (): Promise<boolean> => {
    if (!account.address) return false;
    try {
      const currentAllowance = await readContract(config, {
        abi: erc20Abi,
        address: usdcAddress,
        functionName: "allowance",
        args: [account.address, escrowCA],
      });
      return BigInt(currentAllowance) >= parseUnits(amount, 6);
    } catch (err) {
      console.error("Error checking allowance:", err);
      return false;
    }
  };

  const handleApproveUsdc = async (): Promise<boolean> => {
    try {
      const hasAllowance = await checkAllowance();
      if (hasAllowance) {
        console.log("Sufficient allowance exists, skipping approval");
        return true;
      }

      const { request } = await simulateContract(config, {
        abi: erc20Abi,
        address: usdcAddress,
        functionName: "approve",
        args: [escrowCA, parseUnits(amount, 6)],
      });

      const result = await writeContract(config, request);
      console.log("Approval result:", result);
      return true;
    } catch (err) {
      console.error("USDC approval failed:", err);
      return false;
    }
  };

  const handleDeposit = async () => {
    setIsLoading(true);
    try {
      // if (!account.address) {
      //   throw new Error("Please connect your wallet");
      // }

      // First handle USDC approval
      const approvalSuccess = await handleApproveUsdc();
      if (!approvalSuccess) {
        throw new Error("USDC approval failed");
      }

      // Wait for 2 seconds after approval to ensure transaction is confirmed
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Then handle the deposit
      const { request } = await simulateContract(config, {
        abi: escrowAbi,
        address: escrowCA,
        functionName: "depositUserFund",
        args: [parseUnits(amount, 6)],
      });

      const hash = await writeContract(config, request);
      console.log("Deposit transaction hash:", hash);

      // Wait for the transaction to be mined
      const receipt = await waitForTransaction(config, {
        hash,
        confirmations: 1,
      });
      console.log("Deposit receipt:", receipt);

      setResult({
        success: true,
        message: "Deposit successful!",
      });

      // Refresh balances after successful deposit
      await refreshBalances();
    } catch (error: any) {
      console.error("Deposit error:", error);
      setResult({
        success: false,
        message: error?.message || "An error occurred during the deposit",
      });
    }
    setIsLoading(false);
  };

  const resetModal = () => {
    setAmount("");
    setResult(null);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetModal();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px] rounded-xl">
        <DialogHeader>
          <DialogTitle>Deposit to In-house Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!result && (
            <>
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl"
                >
                  Amount
                </label>
                <div className="mt-1 relative shadow-sm rounded-xl">
                  <Input
                    type="number"
                    name="amount"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    max={maxAmount}
                    step="0.01"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="flex justify-between rounded-xl">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeposit}
                  disabled={
                    !amount || Number.parseFloat(amount) <= 0 || isLoading
                  }
                  className="rounded-xl"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Depositing...
                    </>
                  ) : (
                    "Deposit"
                  )}
                </Button>
              </div>
            </>
          )}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                {result.success ? (
                  <div className="text-green-500">
                    <Check className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-xl font-semibold">{result.message}</p>
                  </div>
                ) : (
                  <div className="text-red-500">
                    <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-base font-semibold break-words max-h-[200px] overflow-y-auto">
                      {result.message}
                    </p>
                  </div>
                )}
                <Button onClick={onClose} className="mt-6 rounded-xl">
                  Close
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
