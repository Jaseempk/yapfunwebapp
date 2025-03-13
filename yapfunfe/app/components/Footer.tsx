"use client";

import Link from "next/link";
import { Twitter, Github } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-background/80 backdrop-blur-lg border-t border-border/40 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start">
            <div className="relative">
              <span className="font-['Audiowide'] text-3xl font-normal text-white tracking-wide relative inline-block transform skew-x-[-5deg]">
                Yap
              </span>
              <span className="absolute -top-1 -right-12 text-xs font-bold bg-transparent backdrop-blur-sm text-amber-200 px-1.5 py-0.5 rounded-md tracking-wider animate-float transform rotate-3 border border-amber-200/40 shadow-[0_0_5px_rgba(253,230,138,0.2)]">
                Beta
              </span>
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
              <Link 
                href="https://github.com/Jaseempk/yapfunwebapp" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <Github className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">GitHub</span>
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
