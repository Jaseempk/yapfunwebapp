"use client";

import { useState } from "react";
import TimeFilter from "./TimeFilter";
import KOLCard from "./KOLCard";
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
    <div>
      <div className="flex flex-col space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
          <h2 className="text-xl sm:text-2xl font-bold">Top Influencers</h2>
          <TimeFilter active={timeRange} onChange={setTimeRange} />
        </div>

        <Tabs defaultValue="mindshare" className="w-full ">
          <TabsList className="w-full sm:w-auto flex justify-between sm:justify-start overflow-x-auto rounded-xl bg-background/50 backdrop-blur-sm">
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

          <TabsContent
            value="mindshare"
            className="mt-3 focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {mockKOLs.map((kol) => (
                <KOLCard key={kol.rank} {...kol} isTop={kol.rank <= 3} />
              ))}
            </div>
          </TabsContent>

          <TabsContent
            value="engagement"
            className="focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="text-center py-4 text-muted-foreground">
              Engagement metrics coming soon
            </div>
          </TabsContent>

          <TabsContent
            value="growth"
            className="focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="text-center py-4 text-muted-foreground">
              Growth metrics coming soon
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
