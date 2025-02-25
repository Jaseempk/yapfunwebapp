"use client";

import { useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "../providers/UserProvider";
import { ConnectButton } from "./ConnectButton";
import { motion } from "framer-motion";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { address, isConnected } = useUser();

  const isActive = useCallback(
    (path: string) => {
      return pathname?.startsWith(path);
    },
    [pathname]
  );

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isConnected) return;
    router.push(`/profile/${address}`);
  };

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r white  bg-clip-text"
          >
            yapfun
            <span className="ml-1 text-xs font-medium text-muted-foreground">
              BETA
            </span>
          </Link>

          <div className="hidden md:flex space-x-1">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive("/") &&
                !isActive("/profile") &&
                !isActive("/positions")
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-secondary/50"
              }`}
            >
              Rankings
            </Link>
            <Link
              href="/positions"
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive("/positions")
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-secondary/50"
              }`}
            >
              Positions
            </Link>
            <Link
              href="/analytics"
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive("/analytics")
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-secondary/50"
              }`}
            >
              Analytics
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {isConnected && (
            <button
              onClick={handleProfileClick}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive("/profile")
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-secondary/50"
              } rounded-xl`}
            >
              Profile
            </button>
          )}
          <ConnectButton />
        </div>
      </nav>
    </motion.header>
  );
}
