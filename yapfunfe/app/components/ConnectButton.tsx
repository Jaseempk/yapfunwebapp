"use client";

import { ConnectKitButton } from "connectkit";

export const ConnectButton = () => {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress, ensName }) => {
        return (
          <button
            onClick={show}
            className="bg-green-500 hover:bg-green-600 hidden sm:flex px-6 py-2 rounded-xl font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {isConnected ? ensName ?? truncatedAddress : "Connect Wallet"}
          </button>
        );
      }}
    </ConnectKitButton.Custom>
  );
};
