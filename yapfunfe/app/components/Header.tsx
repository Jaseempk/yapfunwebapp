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
import { getAccount } from "@wagmi/core";
import { config } from "../providers/Web3Providers";

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

  const account = getAccount(config);

  const [inHouseBalance, setInHouseBalance] = useState("0.00");

  // Fetch in-house balance when wallet is connected
  useEffect(() => {
    if (account.address) {
      // TODO: Replace with actual API call to fetch in-house balance
      setInHouseBalance("100.00");
    }
  }, [account.address]);

  return (
    <header className="border-b border-gray-800/50 sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4 md:space-x-8">
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
            {account.address && (
              <div className="text-sm font-medium">
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
            {account.address && (
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
                className="w-[75vw] sm:w-[350px] bg-background border-l border-gray-800"
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
                  {account.address && (
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
