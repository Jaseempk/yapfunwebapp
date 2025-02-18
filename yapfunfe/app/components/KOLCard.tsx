"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Crown,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart2,
} from "lucide-react";
import { motion } from "framer-motion";
import MarketDetail from "./MarketDetail";

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
          className="overflow-hidden transition-all cursor-pointer h-full backdrop-blur-sm bg-background/80 hover:bg-background/90 hover:border-green-500/50 rounded-xl"
          onClick={() => setIsDetailOpen(true)}
        >
          <div className="p-4 flex flex-col h-full">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="relative flex-shrink-0">
                <img
                  src={avatar || "/placeholder.svg"}
                  alt=""
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                  loading="lazy"
                />
                {rank <= 3 && (
                  <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                    <Crown className="w-3 h-3 text-black" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="truncate">
                    <h3 className="font-medium truncate">{name}</h3>
                    <p className="text-sm text-gray-400 truncate">{handle}</p>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <div className="flex items-center space-x-1">
                      <span className="text-base sm:text-lg font-semibold whitespace-nowrap">
                        {mindshare.toFixed(2)}%
                      </span>
                      {performance === "up" && (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      )}
                      {performance === "down" && (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400">
                      Mindshare
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center space-x-1">
                <BarChart2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                <span className="text-gray-400 truncate">{volume}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                <span className="text-gray-400 truncate">{participants}</span>
              </div>
              <div className="text-right text-gray-400 truncate">
                {tweetCount}
                <span className="ml-1">tweets</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 ">
              <Button
                variant="secondary"
                className="bg-green-500/10 text-green-500 hover:bg-green-500/20 h-8 sm:h-9 text-xs sm:text-sm rounded-xl"
              >
                Long
              </Button>
              <Button
                variant="secondary"
                className="bg-red-500/10 text-red-500 hover:bg-red-500/20 h-8 sm:h-9 text-xs sm:text-sm rounded-xl"
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
        }}
      />
    </>
  );
}
