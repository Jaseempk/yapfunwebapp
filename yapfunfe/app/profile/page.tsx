"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../providers/UserProvider";
import { getAccount } from "@wagmi/core";
import { config } from "../providers/Web3Providers";
import { Loader2 } from "lucide-react";

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { address, isConnected, isLoading } = useUser();
  const account = getAccount(config);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const handleRedirect = async () => {
      if (isLoading) return;
      
      setIsRedirecting(true);
      
      // Get address from any available source
      const currentAddress = address || account.address;
      
      // If we have an address, redirect to the profile page
      if ( account.address) {
        router.replace(`/profile/${ account.address}`);
        return;
      }
      
      // If no address is available, stay on this page
      // The user can connect their wallet using the connect button in the header
      setIsRedirecting(false);
    };

    handleRedirect();
  }, [isLoading, address, account.address, router]);

  // Show a loading state while redirecting or a connect prompt if no wallet
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      {isRedirecting ? (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </>
      ) : (
        <>
          <div className="text-2xl font-bold mb-4">Welcome to Your Profile</div>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Please connect your wallet using the button in the header to view your profile.
          </p>
          <div className="animate-bounce mt-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-primary"
            >
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </>
      )}
    </div>
  );
}
