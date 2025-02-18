"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

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
]

function PositionCard({ position }: { position: (typeof mockPositions)[0] }) {
  const isProfitable =
    position.type === "long" ? position.currentPrice > position.entryPrice : position.currentPrice < position.entryPrice

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium">{position.influencer}</div>
          <div className="text-sm text-gray-400">{position.handle}</div>
        </div>
        <Badge variant={position.type === "long" ? "default" : "destructive"}>{position.type.toUpperCase()}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-400">Entry Price</div>
          <div className="font-medium">${position.entryPrice.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-400">Current Price</div>
          <div className="font-medium">${position.currentPrice.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-400">Size</div>
          <div className="font-medium">${position.size.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-400">PnL</div>
          <div
            className={`font-medium flex items-center space-x-1 ${isProfitable ? "text-green-500" : "text-red-500"}`}
          >
            {isProfitable ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{position.pnl}%</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function PositionsContent() {
  const [activeTab, setActiveTab] = useState("open")

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Positions</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-gray-400">Total PnL: </span>
              <span className="text-green-500 font-medium">+12.53%</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="open" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="open">Open Positions</TabsTrigger>
            <TabsTrigger value="closed">Position History</TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockPositions.map((position) => (
                <PositionCard key={position.id} position={position} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="closed">
            <div className="text-center py-12 text-gray-500">Position history coming soon</div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

