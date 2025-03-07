"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../providers/UserProvider";
import PositionsContent from "../components/PositionsContent";
import { getAccount } from "@wagmi/core";
import { config } from "../providers/Web3Providers";

export default function PositionsPage() {
  const router = useRouter();
  const { isConnected, isLoading, ensureWalletConnected } = useUser();
  const account = getAccount(config);

  useEffect(() => {
    const checkAccess = async () => {
      if (!isLoading) {
        const hasAccess = await ensureWalletConnected();
        if (!hasAccess) {
          router.replace("/");
        }
      }
    };

    checkAccess();
  }, [isLoading, ensureWalletConnected, router]);

  // Show loading state while checking wallet connection
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not connected and no account, redirect will happen in useEffect
  if (!isConnected && !account.address) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Your Positions</h1>
          <p className="text-muted-foreground mt-2">
            Manage your active and filled positions across all KOLs
          </p>
        </div>
        
        <div className="bg-card/30 rounded-xl p-6 backdrop-blur-sm border border-border/50">
          <PositionsContent />
        </div>
      </div>
    </div>
  );
}
