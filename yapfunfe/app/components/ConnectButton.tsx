"use client";

import { ConnectKitButton } from "connectkit";
import { useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, ChevronDown } from "lucide-react";

export const ConnectButton = () => {
  const { disconnect } = useDisconnect();

  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show }) => {
        if (isConnected) {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="secondary" 
                  className="flex items-center gap-2"
                >
                  <span>Connected</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={show}>
                  View Wallet
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => disconnect()}
                  className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Disconnect</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        return (
          <Button 
            onClick={show}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            Connect Wallet
          </Button>
        );
      }}
    </ConnectKitButton.Custom>
  );
};
