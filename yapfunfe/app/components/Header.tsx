"use client";

import { useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "../providers/UserProvider";
import { ConnectButton } from "./ConnectButton";
import { motion } from "framer-motion";
import { config } from "../providers/Web3Providers";
import { getAccount } from "@wagmi/core";
import HowItWorksModal from "./HowItWorksModal";
import { toast } from "sonner";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const account = getAccount(config);
  const { address, isConnected, ensureWalletConnected } = useUser();

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
      console.log("Attempting navigation to:", path);
      console.log("Current connection status:", { isConnected, address: currentAddress });
      
      // If already connected, navigate directly
      if (isConnected && currentAddress) {
        console.log("User is connected, navigating directly");
        router.push(path);
        return;
      }

      // Otherwise, check connection
      const hasAccess = await ensureWalletConnected();
      console.log("Wallet connection check result:", hasAccess);
      
      if (hasAccess) {
        console.log("Access granted, navigating to:", path);
        // Force a hard navigation
        window.location.href = path;
      } else {
        console.log("Access denied, showing toast");
        toast.error("Please connect your wallet first");
      }
    } catch (error) {
      console.error("Navigation error:", error);
      toast.error("Navigation failed. Please try again.");
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
          {(isConnected || account.address) && currentAddress && (
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
          )}
          <ConnectButton />
        </div>
      </nav>
    </motion.header>
  );
}
