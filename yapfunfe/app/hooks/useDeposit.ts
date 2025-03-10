"use client";

import { useState } from "react";
import { writeContract, waitForTransaction } from "@wagmi/core";
import { config } from "../providers/Web3Providers";
import { baseSepolia } from "wagmi/chains";
import { erc20Abi } from "viem";
import { escrowAbi, escrowCA } from "@/contractAbi/escrowAbi";
import { toast } from "../components/ui/use-toast";

const USDC_ADDRESS = "0xC129124eA2Fd4D63C1Fc64059456D8f231eBbed1";

export function useDeposit() {
  const [loading, setLoading] = useState(false);

  const deposit = async (
    amount: string
  ): Promise<{ success: boolean; message: string }> => {
    setLoading(true);
    try {
      const depositAmount = BigInt(parseFloat(amount) * 1e6); // Convert to USDC decimals

      // First approve USDC transfer
      const approveHash = await writeContract(config, {
        abi: erc20Abi,
        address: USDC_ADDRESS,
        functionName: "approve",
        args: [escrowCA, depositAmount],
      });

      toast({
        title: "Approving USDC",
        description: "Please wait while we approve USDC transfer...",
      });

      await waitForTransaction(config, {
        hash: approveHash,
        chainId: baseSepolia.id,
      });

      // Then deposit into escrow
      const depositHash = await writeContract(config, {
        abi: escrowAbi,
        address: escrowCA,
        functionName: "deposit",
        args: [depositAmount],
      });

      toast({
        title: "Processing Deposit",
        description: "Please wait while your deposit is being processed...",
      });

      await waitForTransaction(config, {
        hash: depositHash,
        chainId: baseSepolia.id,
      });

      toast({
        title: "Success",
        description: `Successfully deposited ${amount} USDC`,
      });

      return { success: true, message: "Deposit successful!" };
    } catch (err) {
      console.error("Error depositing:", err);
      toast({
        title: "Error",
        description: "Failed to process deposit. Please try again.",
        variant: "destructive",
      });
      return { success: false, message: "Deposit failed" };
    } finally {
      setLoading(false);
    }
  };

  return {
    deposit,
    loading,
  };
}
