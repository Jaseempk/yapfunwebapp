"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "../providers/UserProvider";
import { ConnectButton } from "./ConnectButton";
import { motion } from "framer-motion";
import { config } from "../providers/Web3Providers";
import { getAccount } from "@wagmi/core";
import HowItWorksModal from "./HowItWorksModal";
import { toast } from "sonner";
import { useBalances } from "../hooks/useBalances";
import DepositModal from "./DepositModal";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const account = getAccount(config);
  const { address, isConnected, ensureWalletConnected } = useUser();
  const { inHouseBalance, userBalance, refreshBalances } = useBalances();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const isActive = useCallback(
    (path: string) => {
      return pathname?.startsWith(path);
    },
    [pathname]
  );

  // Get the current user's address from either source
  const currentAddress = address || account.address;

  const handleProtectedNavigation = async (path: string) => {
    try {
      // If not connected, try to connect first
      if (!isConnected) {
        const hasConnected = await ensureWalletConnected();
        if (!hasConnected) {
          toast.error("Please connect your wallet first");
          return;
        }
      }

      // If we get here, we're either already connected or just connected
      // Use direct window navigation for reliability
      window.location.href = path;
      
    } catch (error) {
      console.error("Navigation error:", error);
      toast.error("Navigation failed. Please try again.");
    }
  };

  const handleDeposit = async (
    amount: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      // Here we're just passing through the deposit request
      // The actual deposit logic is handled in the DepositModal
      return {
        success: true,
        message: "Deposit initiated successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Deposit failed",
      };
    }
  };

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r white bg-clip-text"
          >
            Yapfun
            <span className="ml-1 text-xs font-medium text-muted-foreground">
              BETA
            </span>
          </Link>

          <div className="hidden md:flex space-x-1">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive("/") &&
                !isActive("/profile") &&
                !isActive("/positions")
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-secondary/50"
              } rounded-xl`}
            >
              Rankings
            </Link>
            {(isConnected || account.address) && (
              <button
                onClick={() => handleProtectedNavigation("/positions")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isActive("/positions")
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-secondary/50"
                } rounded-xl`}
              >
                Positions
              </button>
            )}
            <Link
              href="/analytics"
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive("/analytics")
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-secondary/50"
              } rounded-xl`}
            >
              Analytics
            </Link>
            <HowItWorksModal />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {(isConnected || account.address) && (
            <>
              <button
                onClick={() => setIsDepositModalOpen(true)}
                className="px-4 py-2 rounded-lg transition-colors hover:bg-secondary/50 text-sm font-medium"
              >
                ${Number(inHouseBalance).toFixed(2)}
              </button>
              <button
                onClick={() => handleProtectedNavigation(`/profile/${currentAddress}`)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isActive("/profile")
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-secondary/50"
                } rounded-xl`}
              >
                Profile
              </button>
            </>
          )}
          <ConnectButton />
        </div>
      </nav>

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onDeposit={handleDeposit}
        maxAmount={userBalance}
      />
    </motion.header>
  );
}
