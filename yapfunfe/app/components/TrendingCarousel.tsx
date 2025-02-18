"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  TrendingUpIcon as Trending,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "../hooks/use-media-query";

interface TrendingItem {
  id: number;
  name: string;
  handle: string;
  avatar: string;
  change: number;
  volume: string;
  participants: number;
}

const mockTrending: TrendingItem[] = [
  {
    id: 1,
    name: "aixbt",
    handle: "@aixbt_agent",
    avatar: "https://v0.dev/placeholder.svg?height=40&width=40",
    change: 12.5,
    volume: "$24.5K",
    participants: 156,
  },
  {
    id: 2,
    name: "vitalik.eth",
    handle: "@VitalikButerin",
    avatar: "https://v0.dev/placeholder.svg?height=40&width=40",
    change: 8.2,
    volume: "$18.2K",
    participants: 89,
  },
  {
    id: 3,
    name: "mert",
    handle: "@mert_eth",
    avatar: "https://v0.dev/placeholder.svg?height=40&width=40",
    change: -5.3,
    volume: "$12.1K",
    participants: 67,
  },
];

export default function TrendingCarousel() {
  const [page, setPage] = React.useState(0);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const itemsPerPage = isDesktop ? 3 : 1;

  const nextPage = () => {
    setPage((p) => (p + 1) % Math.ceil(mockTrending.length / itemsPerPage));
  };

  const prevPage = () => {
    setPage(
      (p) =>
        (p - 1 + Math.ceil(mockTrending.length / itemsPerPage)) %
        Math.ceil(mockTrending.length / itemsPerPage)
    );
  };

  return (
    <div className="relative">
      <div className="flex items-center mb-4">
        <div className="flex items-center space-x-2">
          <Trending className="w-5 h-5 text-green-500" />
          <h2 className="text-lg font-semibold">Trending Now</h2>
        </div>
        <div className="ml-auto space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevPage}
            className="h-8 w-8"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextPage}
            className="h-8 w-8"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {mockTrending
              .slice(page * itemsPerPage, (page + 1) * itemsPerPage)
              .map((item) => (
                <Card
                  key={item.id}
                  className="p-4 hover:border-green-500/50 transition-colors cursor-pointer rounded-xl"
                >
                  <div className="flex items-start space-x-4">
                    <img
                      src={item.avatar || "/placeholder.svg"}
                      alt=""
                      className="w-10 h-10 rounded-full"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="truncate">
                          <h3 className="font-medium truncate">{item.name}</h3>
                          <p className="text-sm text-gray-400 truncate">
                            {item.handle}
                          </p>
                        </div>
                        <span
                          className={`text-sm font-medium whitespace-nowrap ${
                            item.change >= 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {item.change >= 0 ? "+" : ""}
                          {item.change}%
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm text-gray-400">
                        <span className="truncate">Vol: {item.volume}</span>
                        <span className="whitespace-nowrap">
                          {item.participants} traders
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
