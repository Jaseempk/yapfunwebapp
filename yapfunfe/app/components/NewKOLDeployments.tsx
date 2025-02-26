"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { RocketIcon, ExternalLink, TrendingUp } from "lucide-react";
import { gql, useSubscription } from "@apollo/client";

const MARKET_DEPLOYED_SUBSCRIPTION = gql`
  subscription OnMarketDeployed {
    marketDeployed {
      kolId
      marketAddress
      kolName
      timestamp
      mindshare
      rank
    }
  }
`;

interface KOLDeployment {
  kolId: string;
  marketAddress: string;
  kolName: string;
  timestamp: string;
  mindshare: number;
  rank: string;
}

export default function NewKOLDeployments() {
  const [deployments, setDeployments] = React.useState<KOLDeployment[]>([]);

  const { data } = useSubscription(MARKET_DEPLOYED_SUBSCRIPTION, {
    onData: ({ data }) => {
      if (data?.data?.marketDeployed) {
        setDeployments((prev) => [
          data.data.marketDeployed,
          ...prev.slice(0, 2),
        ]);
      }
    },
  });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);

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
                key={`${deployment.kolId}-${deployment.timestamp}`}
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: 20, height: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-full"
              >
                <Card className="p-2 sm:p-3 hover:border-green-500/50 transition-all cursor-pointer rounded-xl bg-gradient-to-r from-background/50 to-background/50 hover:from-green-950/30 hover:to-background/50">
                  <div className="flex items-start space-x-2 sm:space-x-4">
                    <div className="relative">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-2 ring-green-500/20 bg-green-500/10 flex items-center justify-center">
                        <RocketIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                      </div>
                      <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 sm:p-1">
                        <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-background" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="truncate">
                          <div className="flex items-center space-x-1">
                            <h3 className="text-sm sm:text-base font-medium truncate">
                              {deployment.kolName}
                            </h3>
                            <a
                              href={`https://basescan.org/address/${deployment.marketAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary ml-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            Market: {deployment.marketAddress.slice(0, 6)}...
                            {deployment.marketAddress.slice(-4)}
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
