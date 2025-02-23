"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { RocketIcon, ExternalLink, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KOLDeployment {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  timestamp: string;
  mindshare: number;
  rank: number;
}

// This would come from your WebSocket connection in production
const mockDeployments: KOLDeployment[] = [
  {
    id: "1",
    name: "cryptoWizard",
    handle: "@crypto_wizard",
    avatar: "https://v0.dev/placeholder.svg?height=40&width=40",
    timestamp: new Date().toISOString(),
    mindshare: 15.2,
    rank: 76,
  },
  {
    id: "2",
    name: "defiQueen",
    handle: "@defi_queen",
    avatar: "https://v0.dev/placeholder.svg?height=40&width=40",
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    mindshare: 12.8,
    rank: 82,
  },
  {
    id: "3",
    name: "vitalik.eth",
    handle: "@vitalikbuterin",
    avatar: "https://v0.dev/placeholder.svg?height=40&width=40",
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    mindshare: 12.8,
    rank: 82,
  },
];

export default function NewKOLDeployments() {
  const [deployments, setDeployments] = React.useState(mockDeployments);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);

  // In production, this would be your WebSocket connection
  React.useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new deployment every 10 seconds
      const newDeployment: KOLDeployment = {
        id: Math.random().toString(),
        name: `kol${Math.floor(Math.random() * 1000)}`,
        handle: `@kol${Math.floor(Math.random() * 1000)}`,
        avatar: "https://v0.dev/placeholder.svg?height=40&width=40",
        timestamp: new Date().toISOString(),
        mindshare: Math.random() * 20 + 10,
        rank: Math.floor(Math.random() * 20 + 70),
      };
      setDeployments((prev) => [newDeployment, ...prev.slice(0, 1)]);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Handle horizontal scroll with trackpad
  const handleWheel = (e: WheelEvent) => {
    if (containerRef.current && e.deltaY !== 0) {
      containerRef.current.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  React.useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

  return (
    <div className="relative ">
      <div className="flex items-center mb-3 sm:mb-4">
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <RocketIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
          <h2 className="text-base sm:text-lg font-semibold">
            New Market Deployments
          </h2>
        </div>
      </div>
      <Card className="overflow-hidden h-[120px] sm:h-[140px] relative rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-background/0 via-background/0 to-background/90 pointer-events-none z-10" />
        <div className="flex flex-col gap-1.5 sm:gap-2 p-2 sm:p-3 overflow-hidden">
          <AnimatePresence initial={false}>
            {deployments.map((deployment) => (
              <motion.div
                key={deployment.id}
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: 20, height: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-full"
              >
                <Card className="p-2 sm:p-3 hover:border-green-500/50 transition-all cursor-pointer rounded-xl bg-gradient-to-r from-background/50 to-background/50 hover:from-green-950/30 hover:to-background/50">
                  <div className="flex items-start space-x-2 sm:space-x-4">
                    <div className="relative">
                      <img
                        src={deployment.avatar}
                        alt=""
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-2 ring-green-500/20"
                        loading="lazy"
                      />
                      <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 sm:p-1">
                        <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-background" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="truncate">
                          <div className="flex items-center space-x-1">
                            <h3 className="text-sm sm:text-base font-medium truncate">
                              {deployment.name}
                            </h3>
                            <a
                              href={`https://twitter.com/${deployment.handle.slice(
                                1
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary ml-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {deployment.handle}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs sm:text-sm font-medium text-green-500">
                            #{deployment.rank}
                          </div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground">
                            {new Date(deployment.timestamp).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "numeric",
                                minute: "numeric",
                                hour12: true,
                              }
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-1.5 sm:mt-2 flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Mindshare</span>
                        <span className="font-medium text-green-500 ml-2">
                          {deployment.mindshare.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
