"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAccount } from "wagmi";
import { readContract, writeContract, waitForTransaction } from "@wagmi/core";
import { config } from "../providers/Web3Providers";
import { baseSepolia } from "wagmi/chains";
import { escrowAbi, escrowCA } from "@/contractAbi/escrowAbi";
import { toast } from "../components/ui/use-toast";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxAmount: string;
  onSuccess: () => void;
}

export default function WithdrawModal({
  isOpen,
  onClose,
  maxAmount,
  onSuccess,
}: WithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { address } = useAccount();

  const handleWithdraw = async () => {
    if (!address || !amount) return;

    try {
      setLoading(true);
      const withdrawAmount = BigInt(parseFloat(amount) * 1e6); // Convert to USDC decimals

      const hash = await writeContract(config, {
        abi: escrowAbi,
        address: escrowCA,
        functionName: "withdrawFee",
        args: [withdrawAmount],
      });

      toast({
        title: "Processing Withdrawal",
        description: "Please wait while your withdrawal is being processed...",
      });

      await waitForTransaction(config, {
        hash,
        chainId: baseSepolia.id,
      });

      toast({
        title: "Success",
        description: `Successfully withdrew ${amount} USDC`,
      });

      onSuccess();
      onClose();
      setAmount("");
    } catch (err) {
      console.error("Error withdrawing:", err);
      toast({
        title: "Error",
        description: "Failed to process withdrawal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMaxClick = () => {
    setAmount(maxAmount);
  };

  const isAmountValid =
    amount &&
    !isNaN(parseFloat(amount)) &&
    parseFloat(amount) > 0 &&
    parseFloat(amount) <= parseFloat(maxAmount);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 border-gray-700/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
            Withdraw USDC
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter the amount of USDC you want to withdraw
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-span-4">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="amount"
                  className="text-sm font-medium text-gray-300"
                >
                  Amount
                </label>
                <span className="text-xs text-gray-500">
                  Available: {maxAmount} USDC
                </span>
              </div>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="col-span-3 bg-gray-800/50 border-gray-700"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  max={maxAmount}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMaxClick}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 hover:text-white"
                >
                  MAX
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            disabled={!isAmountValid || loading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {loading ? "Processing..." : "Withdraw"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
