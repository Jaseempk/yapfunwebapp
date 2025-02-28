"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useAccount } from "wagmi";
import { useRouter, usePathname } from "next/navigation";
import { setCookie, deleteCookie } from "cookies-next";
import { getAccount } from "@wagmi/core";
import { config } from "./Web3Providers";

interface UserContextType {
  address: string | undefined;
  isConnected: boolean;
  isLoading: boolean;
  ensureWalletConnected: () => Promise<boolean>;
  userData: {
    totalVolume?: number;
    totalTrades?: number;
    totalPnL?: number;
  };
}

const UserContext = createContext<UserContextType>({
  address: undefined,
  isConnected: false,
  isLoading: true,
  ensureWalletConnected: async () => false,
  userData: {},
});

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({});
  const router = useRouter();
  const pathname = usePathname();

  // Memoize user data to prevent unnecessary re-renders
  const memoizedUserData = useMemo(() => userData, [userData]);

  // Update cookie when wallet connection changes
  useEffect(() => {
    if (isConnected && address) {
      setCookie("connected_address", address, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });
    } else {
      deleteCookie("connected_address", { path: "/" });
    }
  }, [isConnected, address]);

  // Initialize user state and prefetch data
  useEffect(() => {
    const initializeUser = async () => {
      if (isConnected && address) {
        try {
          // Prefetch user data here
          // This could include total volume, trades, PnL, etc.
          const data = {
            totalVolume: 0, // Replace with actual data fetching
            totalTrades: 0,
            totalPnL: 0,
          };
          setUserData(data);
        } catch (error) {
          console.error("Error initializing user:", error);
        }
      } else {
        setUserData({});
      }
      setIsLoading(false);
    };

    initializeUser();
  }, [isConnected, address]);

  // Function to ensure wallet is connected before accessing protected routes
  const ensureWalletConnected = useCallback(async () => {
    // Check both wagmi and direct account status
    const account = getAccount(config);
    const isWalletConnected = isConnected || !!account.address;

    if (!isWalletConnected) {
      // Only redirect if we're on a protected route
      if (
        pathname?.startsWith("/profile") ||
        pathname?.startsWith("/positions")
      ) {
        router.push("/");
      }
      return false;
    }
    return true;
  }, [isConnected, router, pathname]);

  // Update routes when wallet connection changes
  useEffect(() => {
    const account = getAccount(config);
    const isWalletConnected = isConnected || !!account.address;

    if (!isWalletConnected && !isLoading) {
      const currentPath = pathname;
      if (
        currentPath?.startsWith("/profile") ||
        currentPath?.startsWith("/positions")
      ) {
        router.push("/");
      }
    }
  }, [isConnected, isLoading, router, pathname]);

  const value = {
    address: address || getAccount(config).address,
    isConnected: isConnected || !!getAccount(config).address,
    isLoading,
    ensureWalletConnected,
    userData: memoizedUserData,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
