"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import { BookOpen, Info, RefreshCcw } from "lucide-react";

interface MarketDetailProps {
  isOpen: boolean;
  onClose: () => void;
  kol: {
    name: string;
    handle: string;
    avatar: string;
    mindshare: number;
    volume: string;
    participants: number;
    tweetCount: number;
  };
}

const timeRanges = [
  { label: "1H", value: "1h" },
  { label: "6H", value: "6h" },
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
  { label: "1M", value: "1m" },
  { label: "ALL", value: "all" },
];

// Mock data generator for the chart
const generateChartData = (points: number) => {
  return Array.from({ length: points }, (_, i) => ({
    time: new Date(Date.now() - (points - i) * 3600000).toISOString(),
    value: 30 + Math.random() * 20,
  }));
};

export default function MarketDetail({
  isOpen,
  onClose,
  kol,
}: MarketDetailProps) {
  const [timeRange, setTimeRange] = useState("1d");
  const [amount, setAmount] = useState("");
  const chartData = generateChartData(50);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 bg-background">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <img
                src={kol.avatar || "/placeholder.svg"}
                alt=""
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h2 className="text-xl font-bold">{kol.name}</h2>
                <p className="text-gray-400">{kol.handle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <RefreshCcw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Info className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">{kol.mindshare}%</span>
                    <span className="text-gray-400">Mindshare</span>
                  </div>
                  <div className="flex space-x-1">
                    {timeRanges.map((range) => (
                      <Button
                        key={range.value}
                        variant={
                          timeRange === range.value ? "secondary" : "ghost"
                        }
                        size="sm"
                        onClick={() => setTimeRange(range.value)}
                        className="text-xs"
                      >
                        {range.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d374850" />
                      <XAxis
                        dataKey="time"
                        tickFormatter={(time) =>
                          new Date(time).toLocaleTimeString()
                        }
                        stroke="#666"
                      />
                      <YAxis stroke="#666" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "none",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-4">
                <Tabs defaultValue="long">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="long">Long</TabsTrigger>
                    <TabsTrigger value="short">Short</TabsTrigger>
                  </TabsList>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400">Amount</label>
                      <div className="flex space-x-2 mt-1">
                        <Input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="flex-1"
                        />
                        <Button variant="outline" size="sm">
                          Max
                        </Button>
                      </div>
                    </div>
                    <Button className="w-full bg-green-500 hover:bg-green-600">
                      Place Order
                    </Button>
                  </div>
                </Tabs>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <BookOpen className="w-4 h-4" />
                  <h3 className="font-semibold">Order Book</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Price</span>
                    <span>Size</span>
                    <span>Total</span>
                  </div>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-green-500">
                        ${(40 - i * 0.5).toFixed(2)}
                      </span>
                      <span>{(Math.random() * 1000).toFixed(0)}</span>
                      <span>${(Math.random() * 10000).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="py-2 text-center font-medium">
                    ${kol.mindshare.toFixed(2)}%
                  </div>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-red-500">
                        ${(39.5 - i * 0.5).toFixed(2)}
                      </span>
                      <span>{(Math.random() * 1000).toFixed(0)}</span>
                      <span>${(Math.random() * 10000).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <Card className="p-4">
              <div className="text-gray-400 text-sm">24h Volume</div>
              <div className="text-lg font-semibold mt-1">{kol.volume}</div>
            </Card>
            <Card className="p-4">
              <div className="text-gray-400 text-sm">Participants</div>
              <div className="text-lg font-semibold mt-1">
                {kol.participants}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-gray-400 text-sm">Tweet Count</div>
              <div className="text-lg font-semibold mt-1">{kol.tweetCount}</div>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
