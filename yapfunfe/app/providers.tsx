"use client";

import { ThemeProvider } from "next-themes";
import { ApolloProvider } from "./providers/ApolloProvider";
import { Web3Provider } from "./providers/Web3Providers";
import { UserProvider } from "./providers/UserProvider";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Web3Provider>
        <UserProvider>
          <ApolloProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem={false}
            >
              <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
            </ThemeProvider>
          </ApolloProvider>
        </UserProvider>
      </Web3Provider>
    </Suspense>
  );
}
