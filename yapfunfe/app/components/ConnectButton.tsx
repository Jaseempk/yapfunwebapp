"use client";

import { ConnectKitButton } from "connectkit";

export const ConnectButton = () => {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress, ensName }) => {
        const handleClick = () => {
            show?.();
        };

        return (
            <button
              onClick={handleClick}
              className="bg-green-500 hover:bg-green-600 px-4 py-3 rounded-lg text-white transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-green-500/25 flex items-center justify-center"
            >
              <span className="text-sm font-medium">
                {isConnected ? ensName ?? truncatedAddress : "Connect Wallet"}
              </span>
            </button>
        );
      }}
    </ConnectKitButton.Custom>
  );
};
