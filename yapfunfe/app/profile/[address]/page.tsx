"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useUser } from "../../providers/UserProvider";
import ProfileContent from "../../components/ProfileContent";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { address } = useParams();
  const { isConnected, ensureWalletConnected, isLoading } = useUser();

  useEffect(() => {
    ensureWalletConnected();
  }, [ensureWalletConnected]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConnected) {
    return null; // UserProvider will handle redirect
  }

  return <ProfileContent userAddress={address as string} />;
}
