"use client";

import { useState } from "react";
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

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: string) => Promise<{ success: boolean; message: string }>;
  maxAmount: string;
}

export default function DepositModal({
  isOpen,
  onClose,
  onDeposit,
  maxAmount,
}: DepositModalProps) {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleDeposit = async () => {
    setIsLoading(true);
    try {
      const response = await onDeposit(amount);
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        message: "An error occurred during the deposit.",
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
                    <p className="text-xl font-semibold">{result.message}</p>
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
