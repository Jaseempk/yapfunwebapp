"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

const mockPositions = [
  {
    id: 1,
    influencer: "aixbt",
    handle: "@aixbt_agent",
    type: "long",
    entryPrice: 2.15,
    currentPrice: 2.32,
    pnl: 7.91,
    size: 1000,
  },
  {
    id: 2,
    influencer: "vitalik.eth",
    handle: "@VitalikButerin",
    type: "short",
    entryPrice: 1.95,
    currentPrice: 1.86,
    pnl: 4.62,
    size: 500,
  },
  // Add more mock positions...
];

function PositionCard({
  position,
  index,
}: {
  position: (typeof mockPositions)[0];
  index: number;
}) {
  const isProfitable =
    position.type === "long"
      ? position.currentPrice > position.entryPrice
      : position.currentPrice < position.entryPrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="h-full"
    >
      <Card className="position-card p-4 sm:p-6 bg-gradient-to-br from-gray-900/80 via-gray-800/90 to-gray-900/80 border-gray-700/50 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 h-full rounded-2xl backdrop-blur-lg group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4">
          <div>
            <div className="font-medium text-base sm:text-lg font-['Orbitron'] bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent group-hover:from-purple-200 group-hover:via-pink-200 group-hover:to-purple-200 transition-all duration-500">
              {position.influencer}
            </div>
            <div className="text-xs sm:text-sm text-gray-400/80 font-['Space_Grotesk']">
              {position.handle}
            </div>
          </div>
          <Badge
            variant={position.type === "long" ? "default" : "destructive"}
            className="self-start sm:self-center text-xs px-3 py-1.5 font-['Space_Grotesk'] tracking-wider rounded-xl"
          >
            {position.type.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm mt-6">
          <div className="space-y-1">
            <div className="text-gray-400/60 text-[10px] sm:text-xs uppercase tracking-[0.2em] font-['Space_Grotesk'] mb-1">
              Entry Price
            </div>
            <div className="font-medium text-base sm:text-lg font-['Space_Grotesk'] text-white/90">
              ${position.entryPrice.toFixed(2)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-gray-400/80 text-xs sm:text-sm uppercase tracking-wider">
              Current Price
            </div>
            <div className="font-medium text-base sm:text-lg font-['Space_Grotesk']">
              ${position.currentPrice.toFixed(2)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-gray-400/80 text-xs sm:text-sm uppercase tracking-wider">
              Size
            </div>
            <div className="font-medium text-base sm:text-lg font-['Space_Grotesk']">
              ${position.size.toLocaleString()}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-gray-400/80 text-xs sm:text-sm uppercase tracking-wider">
              PnL
            </div>
            <div
              className={`font-medium text-base sm:text-lg flex items-center gap-2 ${
                isProfitable
                  ? "text-green-400 group-hover:text-green-300"
                  : "text-red-400 group-hover:text-red-300"
              } transition-colors duration-500`}
            >
              {isProfitable ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{position.pnl}%</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function PositionsContent() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="open" className="w-full">
        <TabsList className="w-full sm:w-auto flex justify-center mx-auto mb-8 rounded-2xl bg-gray-800/30 p-1 backdrop-blur-lg border border-gray-700/50">
          <TabsTrigger
            value="open"
            className="flex-1 sm:flex-none sm:min-w-[140px] rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 font-['Space_Grotesk'] tracking-wide"
          >
            Open Positions
          </TabsTrigger>
          <TabsTrigger
            value="closed"
            className="flex-1 sm:flex-none sm:min-w-[140px] rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/20 data-[state=active]:to-red-500/20 font-['Space_Grotesk'] tracking-wide"
          >
            Position History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {mockPositions.map((position, index) => (
              <PositionCard
                key={position.id}
                position={position}
                index={index}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="closed" className="mt-0">
          <div className="text-center py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-base sm:text-lg font-['Space_Grotesk'] text-gray-500/70 bg-gradient-to-r from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-800/50"
            >
              Position history coming soon
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
