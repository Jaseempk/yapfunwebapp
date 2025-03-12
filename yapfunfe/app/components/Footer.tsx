"use client";

import Link from "next/link";
import { Twitter } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-background/80 backdrop-blur-lg border-t border-border/40 py-6 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start">
            <div className="text-xl font-bold">
              Yapfun
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Trade KOL Mindshare
            </p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="flex space-x-4 items-center">
              <Link 
                href="https://x.com/meesaj__" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <Twitter className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">@meesaj__</span>
              </Link>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              © {currentYear} Yapfun. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
