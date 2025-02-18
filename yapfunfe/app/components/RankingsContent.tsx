"use client";

import { useState } from "react";
import TimeFilter from "./TimeFilter";
import KOLCard from "./KOLCard";
import TrendingCarousel from "./TrendingCarousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockKOLs = [
  {
    rank: 1,
    name: "aixbt",
    handle: "@aixbt_agent",
    avatar: "https://v0.dev/placeholder.svg?height=48&width=48",
    mindshare: 2.02,
    performance: "up",
    volume: "$24.5K",
    participants: 156,
    tweetCount: 342,
  },
  {
    rank: 2,
    name: "vitalik.eth",
    handle: "@VitalikButerin",
    mindshare: 1.86,
    avatar: "https://v0.dev/placeholder.svg?height=48&width=48",
    performance: "up",
    volume: "$24.5K",
    participants: 156,
    tweetCount: 342,
  },
  {
    rank: 3,
    name: "mert",
    handle: "@mert_eth",
    mindshare: 1.06,
    avatar: "https://v0.dev/placeholder.svg?height=48&width=48",
    performance: "down",
    volume: "$24.5K",
    participants: 156,
    tweetCount: 342,
  },
  {
    rank: 4,
    name: "jesse.base",
    handle: "@jesse_base",
    mindshare: 0.83,
    avatar: "https://v0.dev/placeholder.svg?height=48&width=48",
    performance: "up",
    volume: "$24.5K",
    participants: 156,
    tweetCount: 342,
  },
  {
    rank: 5,
    name: "DCInvestor",
    handle: "@iamDCinvestor",
    mindshare: 0.61,
    avatar: "https://v0.dev/placeholder.svg?height=48&width=48",
    performance: "down",
    volume: "$24.5K",
    participants: 156,
    tweetCount: 342,
  },
  {
    rank: 6,
    name: "Ansem",
    handle: "@ansem",
    mindshare: 0.61,
    avatar: "https://v0.dev/placeholder.svg?height=48&width=48",
    performance: "neutral",
    volume: "$24.5K",
    participants: 156,
    tweetCount: 342,
  },
  // ... other mock data
] as const;

export default function RankingsContent() {
  const [timeRange, setTimeRange] = useState("30d");

  return (
    <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <section className="mb-6 sm:mb-8">
        <TrendingCarousel />
      </section>

      <div className="flex flex-col space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
          <h2 className="text-xl sm:text-2xl font-bold">Top Influencers</h2>
          <TimeFilter active={timeRange} onChange={setTimeRange} />
        </div>

        <Tabs defaultValue="mindshare" className="w-full ">
          <TabsList className="w-full sm:w-auto flex justify-between sm:justify-start overflow-x-auto rounded-s-md">
            <TabsTrigger
              value="mindshare"
              className="flex-1 sm:flex-none rounded-xl"
            >
              Mindshare
            </TabsTrigger>
            <TabsTrigger
              value="engagement"
              className="flex-1 sm:flex-none rounded-xl"
            >
              Engagement
            </TabsTrigger>
            <TabsTrigger
              value="growth"
              className="flex-1 sm:flex-none rounded-xl"
            >
              Growth
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mindshare" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {mockKOLs.map((kol) => (
                <KOLCard key={kol.rank} {...kol} isTop={kol.rank <= 3} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="engagement">
            <div className="text-center py-8 sm:py-12 text-gray-500">
              Engagement metrics coming soon
            </div>
          </TabsContent>

          <TabsContent value="growth">
            <div className="text-center py-8 sm:py-12 text-gray-500">
              Growth metrics coming soon
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
