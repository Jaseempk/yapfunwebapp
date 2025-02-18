"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon, BellIcon, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  { name: "Rankings", href: "/" },
  { name: "Positions", href: "/positions" },
  { name: "Analytics", href: "/analytics" },
];

export default function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="border-b border-gray-800/50 sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4 md:space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-xl font-bold font-serif bg-gradient-to-r white bg-clip-text ">
                YapFun
              </div>
              <div className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-500">
                BETA
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className="text-sm"
                  >
                    {item.name}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <BellIcon className="h-5 w-5" />
            </Button>
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
            <Button className="bg-green-500 hover:bg-green-600 hidden sm:flex rounded-xl">
              Connect Wallet
            </Button>

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
                <nav className="flex flex-col space-y-4 mt-4 ">
                  {navigation.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={pathname === item.href ? "secondary" : "ghost"}
                        className="w-full justify-start text-left  rounded-xl"
                      >
                        {item.name}
                      </Button>
                    </Link>
                  ))}
                  <Button className="bg-green-500 hover:bg-green-600 w-full sm:hidden">
                    Connect Wallet
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
