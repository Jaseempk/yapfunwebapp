"use client";

import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Crown,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart2,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import MarketDetail from "./MarketDetail";
import ExpiryTimer from "./ExpiryTimer";

interface KOLCardProps {
  rank: number;
  name: string;
  handle: string;
  avatar: string;
  mindshare: number;
  performance?: "up" | "down" | "neutral";
  volume: string;
  participants: number;
  tweetCount: number;
  isTop?: boolean;
  kolId: string;
  marketAddress?: `0x${string}`;
  startTime?: number;
}

export default function KOLCard({
  rank,
  name,
  handle,
  avatar,
  mindshare,
  performance = "neutral",
  volume,
  participants,
  tweetCount,
  isTop = false,
  kolId,
  marketAddress,
  startTime,
}: KOLCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="h-full"
      >
        <Card
          className="overflow-hidden transition-all cursor-pointer h-full backdrop-blur-sm bg-background/50 hover:bg-background/70 hover:border-green-500/50 rounded-xl hover:scale-[1.02]"
          onClick={() => setIsDetailOpen(true)}
        >
          <div className="p-3 sm:p-4 flex flex-col h-full">
            <div className="flex items-start space-x-2 sm:space-x-4">
              <div className="relative flex-shrink-0">
                <img
                  src={avatar || "/placeholder.svg"}
                  alt=""
                  className="w-9 h-9 sm:w-12 sm:h-12 rounded-full ring-2 ring-green-500/20"
                  loading="lazy"
                />
                {rank <= 3 && (
                  <div className="absolute -top-1 -right-1 bg-yellow-500/90 backdrop-blur-sm rounded-full p-0.5 sm:p-1">
                    <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-background" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="truncate">
                    <h3 className="text-sm sm:text-base font-medium truncate">
                      {name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 truncate">
                      {handle}
                    </p>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm sm:text-lg font-semibold whitespace-nowrap">
                        {mindshare.toFixed(2)}%
                      </span>
                      {performance === "up" && (
                        <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                      )}
                      {performance === "down" && (
                        <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-[10px] sm:text-sm text-gray-400">
                      Mindshare
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {startTime && marketAddress && (
              <div className="mt-2 sm:mt-3 flex items-center justify-end space-x-1 text-muted-foreground">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <ExpiryTimer
                  startTime={startTime}
                  className="text-[10px] sm:text-xs"
                />
              </div>
            )}

            <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-1.5 sm:gap-4 text-[10px] sm:text-sm">
              <div className="flex items-center bg-background/50 rounded-lg p-1.5 sm:p-2">
                <BarChart2 className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                <span className="text-muted-foreground truncate pl-1">
                  {volume}
                </span>
              </div>
              <div className="flex items-center bg-background/50 rounded-lg p-1.5 sm:p-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                <span className="text-muted-foreground truncate pl-1">
                  {participants}
                </span>
              </div>
              <div className="flex items-center bg-background/50 rounded-lg p-1.5 sm:p-2">
                <span className="text-muted-foreground truncate">
                  {tweetCount} tweets
                </span>
              </div>
            </div>

            <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-1.5 sm:gap-3">
              <Button
                variant="secondary"
                className="bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-400 h-7 sm:h-9 text-[10px] sm:text-sm rounded-xl font-medium"
              >
                Long
              </Button>
              <Button
                variant="secondary"
                className="bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 h-7 sm:h-9 text-[10px] sm:text-sm rounded-xl font-medium"
              >
                Short
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      <MarketDetail
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        kol={{
          name,
          handle,
          avatar,
          mindshare,
          volume,
          participants,
          tweetCount,
          kolId,
          marketAddress,
          startTime,
        }}
      />
    </>
  );
}
