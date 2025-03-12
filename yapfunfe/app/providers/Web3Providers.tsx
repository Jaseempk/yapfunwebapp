"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { baseSepolia, base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { ReactNode, useEffect } from "react";

// Create a more resilient transport with retries and longer timeout
const transport = http(
  process.env.NEXT_PUBLIC_RPC_URL ||
    "https://api.developer.coinbase.com/rpc/v1/base-sepolia/DBytHtVTEsZ9VhQE0Zx7WvomGHot4hTI",
  {
    timeout: 30000, // 30 seconds
    retryCount: 3,
    retryDelay: 1000, // 1 second between retries
  }
);

export const config = createConfig(
  getDefaultConfig({
    chains: [baseSepolia],
    transports: {
      [baseSepolia.id]: transport,
    },
    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ||
      "b1647c589ac18a28722c490d2f840895",
    appName: "yapfun",
  })
);

// Configure the query client with retries
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider = ({ children }: Web3ProviderProps) => {
  // Handle network changes and disconnections
  useEffect(() => {
    const handleOnline = () => {
      queryClient.refetchQueries();
    };

    const handleOffline = () => {
      queryClient.cancelQueries();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="midnight"
          options={{
            hideBalance: false,
            enforceSupportedChains: true,
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
