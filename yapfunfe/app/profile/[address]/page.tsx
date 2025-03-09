"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "../../providers/UserProvider";
import ProfileContent from "../../components/ProfileContent";
import { Loader2 } from "lucide-react";
import { getAccount } from "@wagmi/core";
import { config } from "@/app/providers/Web3Providers";
import { Button } from "../../components/ui/button";
import Link from "next/link";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { isConnected, isLoading, address: userAddress } = useUser();
  const account = getAccount(config);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    // Simple check to see if we should show the profile
    const checkAccess = () => {
      if (isLoading) return;
      setIsCheckingAccess(false);
    };

    checkAccess();
  }, [isLoading]);

  // Show loading state while checking
  if (isLoading || isCheckingAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  // If not connected, show connect prompt
  if (!isConnected && !account.address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
        <p className="text-muted-foreground text-center max-w-md mb-4">
          Please connect your wallet to view your profile.
        </p>
        <div className="flex gap-4">
          <Button asChild variant="default">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show the profile content for the connected user
  return <ProfileContent />;
}
