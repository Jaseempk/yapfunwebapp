"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon, BellIcon, Menu, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ConnectKitButton } from "connectkit";
import { useAccount, useBalance } from "wagmi";
import { getAccount, readContract } from "@wagmi/core";
import { config } from "../providers/Web3Providers";
import { escrowAbi, escrowCA } from "@/contractAbi/escrowAbi";

const navigation = [
  { name: "Rankings", href: "/" },
  { name: "Positions", href: "/positions" },
  { name: "Analytics", href: "/analytics" },
];

export default function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address,
  });

  const [inHouseBalance, setInHouseBalance] = useState("0.00");

  const account = getAccount(config);
  // Fetch in-house balance when wallet is connected
  useEffect(() => {
    if (account.address) {
      const fetchBalance = async () => {
        if (!account.address) return;
        try {
          const data = await readContract(config, {
            abi: escrowAbi,
            address: escrowCA,
            functionName: "getUserBalance",
            args: [account.address],
          });
          setInHouseBalance((Number(data) / 1e6).toString());
        } catch (err) {
          console.error("Error fetching balance:", err);
          setInHouseBalance("0.00");
        }
      };

      fetchBalance();

      const interval = setInterval(fetchBalance, 10000);
      return () => clearInterval(interval);
      // TODO: Replace with actual API call to fetch in-house balance
      setInHouseBalance("100.00");
    }
  }, [account.address]);

  return (
    <header className="border-b border-gray-800/50 sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-xl font-bold font-mono tracking-tight bg-gradient-to-r  bg-clip-text ">
                yapfun
              </div>
              <div className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-500">
                BETA
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 rounded-xl">
              {navigation.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className="text-sm rounded-xl"
                  >
                    {item.name}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {address && (
              <div className="hidden sm:block text-sm font-medium">
                Balance: ${inHouseBalance}
              </div>
            )}
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <BellIcon className="h-5 w-5" />
            </Button>
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </Button>
            )}
            <ConnectKitButton />
            {address && (
              <Link href="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[85vw] sm:w-[350px] bg-background border-l border-gray-800 pt-8"
              >
                <nav className="flex flex-col space-y-4 mt-4">
                  {navigation.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={pathname === item.href ? "secondary" : "ghost"}
                        className="w-full justify-start text-left"
                      >
                        {item.name}
                      </Button>
                    </Link>
                  ))}
                  {address && (
                    <Link href="/profile">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left"
                      >
                        Profile
                      </Button>
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
