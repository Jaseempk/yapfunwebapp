"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "../../providers/UserProvider";
import ProfileContent from "../../components/ProfileContent";
import { Loader2 } from "lucide-react";
import { getAccount } from "@wagmi/core";
import { config } from "@/app/providers/Web3Providers";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { isConnected, ensureWalletConnected, isLoading } = useUser();
  const account = getAccount(config);
  const address = params?.address as string;

  useEffect(() => {
    const checkAccess = async () => {
      if (!isLoading) {
        const hasAccess = await ensureWalletConnected();
        if (!hasAccess) {
          router.push("/");
        }
      }
    };

    checkAccess();
  }, [isLoading, ensureWalletConnected, router]);

  // Show loading state while checking wallet connection
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not connected and no account, UserProvider will handle redirect
  if (!isConnected && !account.address) {
    return null;
  }

  // If no address in params, redirect to home
  if (!address) {
    router.push("/");
    return null;
  }

  return <ProfileContent userAddress={address} />;
}
