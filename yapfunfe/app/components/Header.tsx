"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "../providers/UserProvider";
import { ConnectButton } from "./ConnectButton";
import { motion, AnimatePresence } from "framer-motion";
import { config } from "../providers/Web3Providers";
import { getAccount } from "@wagmi/core";
import HowItWorksModal from "./HowItWorksModal";
import { toast } from "sonner";
import { useBalances } from "../hooks/useBalances";
import DepositModal from "./DepositModal";
import SearchBar from "./SearchBar";
import {
  Home,
  TrendingUp,
  BarChart2,
  User,
  HelpCircle,
  Menu,
  X,
  Wallet,
  Search,
} from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const account = getAccount(config);
  const { address, isConnected } = useUser();
  const { inHouseBalance, userBalance, refreshBalances } = useBalances();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  // Check if we're on mobile based on screen width
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Handle clicks outside search bar to collapse it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActive = useCallback(
    (path: string) => {
      return pathname?.startsWith(path);
    },
    [pathname]
  );

  // Get the current user's address from either source
  const currentAddress = address || account.address;

  const handleDeposit = async (
    amount: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      // Here we're just passing through the deposit request
      // The actual deposit logic is handled in the DepositModal
      return {
        success: true,
        message: "Deposit initiated successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Deposit failed",
      };
    }
  };

  // Format address for display
  const formatAddress = (address: string | undefined) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Header for desktop */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-background/90 backdrop-blur-lg border-b z-40 flex items-center justify-between px-4 md:px-8">
        {/* Empty div for spacing */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold">
              Yapfun
            </span>
          </Link>
        </div>

        {/* Search Bar - Desktop (expanded/collapsed) */}
        <div 
          ref={searchRef}
          className={`hidden md:flex items-center transition-all duration-300 ease-in-out ${isSearchExpanded ? 'w-64' : 'w-10'}`}
          onClick={() => !isSearchExpanded && setIsSearchExpanded(true)}
        >
          {isSearchExpanded ? (
            <SearchBar 
              value={searchValue} 
              onChange={setSearchValue} 
              className="w-full"
            />
          ) : (
            <button className="p-2 rounded-full hover:bg-secondary/50 transition-colors">
              <Search size={18} />
            </button>
          )}
        </div>

        {/* Search Bar - Mobile (expandable) */}
        <div 
          className="md:hidden flex items-center mx-4 transition-all duration-300 ease-in-out"
          style={{ width: isMobileMenuOpen ? '0' : (isSearchExpanded ? '100%' : '40px') }}
        >
          {isSearchExpanded ? (
            <div className="w-full">
              <SearchBar 
                value={searchValue} 
                onChange={setSearchValue} 
                className="w-full"
              />
            </div>
          ) : (
            <button 
              className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
              onClick={() => setIsSearchExpanded(true)}
            >
              <Search size={18} />
            </button>
          )}
        </div>

        {/* Navigation Links - Desktop */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              isActive("/") &&
              !isActive("/profile") &&
              !isActive("/positions")
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-secondary/50"
            }`}
          >
            <Home size={16} />
            <span>Rankings</span>
          </Link>

          {(isConnected || account.address) && (
            <button
              onClick={() => router.push("/positions")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive("/positions")
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-secondary/50"
              }`}
            >
              <TrendingUp size={16} />
              <span>Positions</span>
            </button>
          )}

          {/* Uncomment when Analytics is ready
          <Link
            href="/analytics"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              isActive("/analytics")
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-secondary/50"
            }`}
          >
            <BarChart2 size={16} />
            <span>Analytics</span>
          </Link>
          */}

          {(isConnected || account.address) && (
            <Link
              href="/profile"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive("/profile")
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-secondary/50"
              }`}
            >
              <User size={16} />
              <span>Profile</span>
            </Link>
          )}

          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors hover:bg-secondary/50">
            <HelpCircle size={16} />
            <HowItWorksModal />
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 rounded-lg hover:bg-secondary/50"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        {/* Balance and Connect Button */}
        <div className="hidden md:flex items-center space-x-4">
          {(isConnected || account.address) && (
            <button
              onClick={() => setIsDepositModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-fuchsia-500/25"
            >
              <div className="flex items-center space-x-2">
                <Wallet className="h-4 w-4 text-white/90" />
                <div className="flex items-center">
                  <span className="text-sm font-bold text-white/90">
                    ${Number(inHouseBalance).toFixed(2)}
                  </span>
                </div>
              </div>
            </button>
          )}
          <ConnectButton />
        </div>
      </header>

      {/* Mobile Menu - Sidebar */}
      <AnimatePresence>
        {isMobile && isMobileMenuOpen && (
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 w-4/5 max-w-xs bg-background/95 backdrop-blur-lg shadow-xl border-l border-border/50 pt-12"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Close button */}
            <button
              onClick={toggleMobileMenu}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary/50 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex flex-col h-full p-4">
              <nav className="flex flex-col space-y-2">
                <Link
                  href="/"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive("/") &&
                    !isActive("/profile") &&
                    !isActive("/positions")
                      ? "bg-secondary text-secondary-foreground"
                      : "hover:bg-secondary/50"
                  }`}
                  onClick={toggleMobileMenu}
                >
                  <Home size={18} />
                  <span>Rankings</span>
                </Link>

                {(isConnected || account.address) && (
                  <button
                    onClick={() => {
                      router.push("/positions");
                      toggleMobileMenu();
                    }}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      isActive("/positions")
                        ? "bg-secondary text-secondary-foreground"
                        : "hover:bg-secondary/50"
                    }`}
                  >
                    <TrendingUp size={18} />
                    <span>Positions</span>
                  </button>
                )}

                {(isConnected || account.address) && (
                  <Link
                    href="/profile"
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive("/profile")
                        ? "bg-secondary text-secondary-foreground"
                        : "hover:bg-secondary/50"
                    }`}
                    onClick={toggleMobileMenu}
                  >
                    <User size={18} />
                    <span>Profile</span>
                  </Link>
                )}

                <div className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors hover:bg-secondary/50">
                  <HelpCircle size={18} />
                  <HowItWorksModal />
                </div>
              </nav>

              {/* Mobile Balance and Connect Button */}
              <div className="mt-6 pt-6 border-t border-border/50">
                {(isConnected || account.address) && (
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        setIsDepositModalOpen(true);
                        toggleMobileMenu();
                      }}
                      className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 transition-all duration-300 shadow-lg hover:shadow-fuchsia-500/25"
                    >
                      <div className="flex items-center space-x-2">
                        <Wallet className="h-5 w-5 text-white/90" />
                        <div className="flex-1 flex justify-between items-center">
                          <span className="text-sm font-bold text-white/90">
                            Balance:
                          </span>
                          <span className="text-sm font-bold text-white">
                            ${Number(inHouseBalance).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                )}
                <div className="w-full">
                  <ConnectButton />
                </div>

              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onDeposit={handleDeposit}
        maxAmount={userBalance}
        refreshBalances={refreshBalances}
      />
    </>
  );
}
