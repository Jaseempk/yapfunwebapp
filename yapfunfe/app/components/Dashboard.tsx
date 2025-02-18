"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KOLCard from "./KOLCard";
import TopPositionBet from "./TopPositionBet";

const mockKOLs = [
  {
    id: 1,
    name: "Crypto Elon",
    handle: "@cryptoelon",
    mindshare: 85,
    price: 120,
  },
  { id: 2, name: "Bitcoin Maxi", handle: "@btcmaxi", mindshare: 72, price: 95 },
  { id: 3, name: "Eth Queen", handle: "@ethqueen", mindshare: 68, price: 88 },
  // ... add more mock data
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("top100");

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs
        defaultValue="top100"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="top100">Top 100 KOLs</TabsTrigger>
          <TabsTrigger value="topPosition">Top Position Bet</TabsTrigger>
        </TabsList>
        <TabsContent value="top100">
          <Card>
            <CardHeader>
              <CardTitle>Top 100 Crypto KOLs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockKOLs.map((kol) => (
                  <KOLCard key={kol.id} {...kol} isTop={kol.id <= 3} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="topPosition">
          <TopPositionBet />
        </TabsContent>
      </Tabs>
    </div>
  );
}
