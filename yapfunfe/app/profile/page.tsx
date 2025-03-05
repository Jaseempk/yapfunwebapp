"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../providers/UserProvider";
import { getAccount } from "@wagmi/core";
import { config } from "../providers/Web3Providers";

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { address, isConnected, isLoading } = useUser();
  const account = getAccount(config);

  useEffect(() => {
    if (!isLoading) {
      const currentAddress = address || account.address;
      if (isConnected || account.address) {
        if (currentAddress) {
          router.replace(`/profile/${currentAddress}`);
        }
      } else {
        router.replace("/");
      }
    }
  }, [isLoading, isConnected, address, account.address, router]);

  // Show a loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
