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
}
const account = getAccount(config);

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

  const TOKEN_ADDRESS = "0xYourTokenAddress"; // Replace with your token address
  const SPENDER_ADDRESS = "0xSpenderAddress"; // Replace with the spender's address

  const CHAIN_ID = 1; // Mainnet (use the appropriate chain ID)
  const PERMIT2_CONTRACT_ADDRESS = PERMIT2_ADDRESS;

  // const handlePermit2Transfer = async () => {
  //   try {
  //     // Connect to Ethereum provider
  //     const provider = new ethers.providers.Web3Provider(window.ethereum);
  //     await provider.send("eth_requestAccounts", []); // Request user to connect wallet
  //     const signer = provider.getSigner();
  //     const userAddress = await signer.getAddress();

  //     // Step 1: Generate Permit Data
  //     const permitDetails = {
  //       token: TOKEN_ADDRESS,
  //       amount: ethers.utils.parseUnits("100", 18), // Approve 100 tokens
  //       expiration: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour from now
  //       nonce: 0, // Nonce for the permit (can be fetched from Permit2 contract)
  //     };

  //     const permitSingle = {
  //       details: permitDetails,
  //       spender: SPENDER_ADDRESS,
  //       sigDeadline: Math.floor(Date.now() / 1000) + 60 * 10, // Signature valid for 10 minutes
  //     };

  //     // Generate the EIP-712 domain
  //     const domain = {
  //       name: "Permit2",
  //       chainId: CHAIN_ID,
  //       verifyingContract: PERMIT2_CONTRACT_ADDRESS,
  //     };

  //     // Sign the permit
  //     const signature = await signer._signTypedData(
  //       domain,
  //       AllowanceTransfer.types,
  //       {
  //         ...permitSingle,
  //         nonce: permitDetails.nonce,
  //       }
  //     );

  //     // Step 2: Submit the Permit and Transfer Tokens
  //     const permit2 = new ethers.Contract(
  //       PERMIT2_CONTRACT_ADDRESS,
  //       [
  //         "function permit(address owner, PermitSingle memory permitSingle, bytes calldata signature)",
  //         "function transferFrom(address from, address to, uint160 amount, address token)",
  //       ],
  //       signer
  //     );

  //     // Submit the permit
  //     await permit2.permit(
  //       userAddress,
  //       {
  //         details: permitDetails,
  //         spender: SPENDER_ADDRESS,
  //         sigDeadline: permitSingle.sigDeadline,
  //       },
  //       signature
  //     );

  //     // Transfer tokens using Permit2
  //     await permit2.transferFrom(
  //       userAddress, // From
  //       SPENDER_ADDRESS, // To
  //       ethers.utils.parseUnits("50", 18), // Transfer 50 tokens
  //       TOKEN_ADDRESS
  //     );
  //   } catch (error) {
  //     console.error("Permit2 transfer failed:", error);
  //     throw error;
  //   }
  // };

  const usdcAddress = "0xC129124eA2Fd4D63C1Fc64059456D8f231eBbed1";
  const handlApproveUsdc = async () => {
    try {
      const { request } = await simulateContract(config, {
        abi: erc20Abi,
        address: usdcAddress,
        functionName: "approve",
        args: [escrowCA, parseUnits(amount, 6)],
      });

      const result = await writeContract(config, request);
      console.log("resulet:", result);
    } catch (err) {
      console.error("USDC approval failed:", err);

      return;
    }
  };

  const handleDeposit = async () => {
    setIsLoading(true);
    try {
      const response = await onDeposit(amount);
      console.log(`Depositing ${amount} USDC`);
      await handlApproveUsdc();

      const { request } = await simulateContract(config, {
        abi: escrowAbi,
        address: escrowCA,
        functionName: "depositUserFund",
        args: [parseUnits(amount, 6)],
      });

      const result = await writeContract(config, request);
      console.log("resulet:", result);

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
