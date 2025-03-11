"use client";

import { ConnectKitButton } from "connectkit";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDisconnect } from "wagmi";

export const ConnectButton = () => {
  const [showDisconnect, setShowDisconnect] = useState(false);
  const { disconnect } = useDisconnect();

  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress, ensName }) => {
        const handleClick = () => {
          if (isConnected) {
            setShowDisconnect(!showDisconnect);
          } else {
            show?.();
          }
        };

        const handleDisconnect = (e: React.MouseEvent) => {
          e.stopPropagation();
          disconnect();
          setShowDisconnect(false);
        };

        return (
          <div className="relative">
            <button
              onClick={handleClick}
              className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-white transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-green-500/25 flex items-center justify-center"
            >
              <span className="text-sm font-medium">
                {isConnected ? ensName ?? truncatedAddress : "Connect Wallet"}
              </span>
            </button>

            <AnimatePresence>
              {showDisconnect && isConnected && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-full"
                >
                  <button
                    onClick={handleDisconnect}
                    className="w-full bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-red-500/25 text-sm font-medium"
                  >
                    Disconnect
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      }}
    </ConnectKitButton.Custom>
  );
};
