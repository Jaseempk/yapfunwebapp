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
import {
  BookOpen,
  Info,
  RefreshCcw,
  ChevronUp,
  ChevronDown,
  Clock,
  Users,
  BarChart2,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";

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
] as const;

// Custom tooltip component for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
        <p className="text-sm font-medium">
          {new Date(label).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          })}
        </p>
        <p className="text-sm text-green-500 font-medium">
          {payload[0].value.toFixed(2)}%
        </p>
      </div>
    );
  }
  return null;
};

// Order book entry component
const OrderBookEntry = ({
  price,
  size,
  total,
  type,
}: {
  price: number;
  size: number;
  total: number;
  type: "buy" | "sell";
}) => {
  const maxTotal = 10000; // Example maximum total for progress bar
  return (
    <div className="relative">
      <div
        className={`absolute inset-0 ${
          type === "buy" ? "bg-green-500/10" : "bg-red-500/10"
        }`}
        style={{ width: `${(total / maxTotal) * 100}%` }}
      />
      <div className="relative grid grid-cols-3 gap-4 py-1 text-sm">
        <span className={type === "buy" ? "text-green-500" : "text-red-500"}>
          ${price.toFixed(2)}
        </span>
        <span className="text-right">{size.toLocaleString()}</span>
        <span className="text-right">${total.toLocaleString()}</span>
      </div>
    </div>
  );
};

// Generate mock chart data
const generateChartData = (timeRange: string) => {
  const points =
    {
      "1h": 60,
      "6h": 360,
      "1d": 1440,
      "1w": 10080,
      "1m": 43200,
      all: 87600,
    }[timeRange] || 1440;

  const interval =
    {
      "1h": 60000, // 1 minute
      "6h": 360000, // 6 minutes
      "1d": 900000, // 15 minutes
      "1w": 3600000, // 1 hour
      "1m": 14400000, // 4 hours
      all: 28800000, // 8 hours
    }[timeRange] || 900000;

  return Array.from({ length: points }, (_, i) => ({
    time: new Date(Date.now() - (points - i) * interval).toISOString(),
    value: 30 + Math.random() * 20 + Math.sin(i / 10) * 5,
  }));
};

export default function MarketDetail({
  isOpen,
  onClose,
  kol,
}: MarketDetailProps) {
  const [timeRange, setTimeRange] =
    useState<(typeof timeRanges)[number]["value"]>("1d");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"long" | "short">("long");
  const chartData = generateChartData(timeRange);

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    // Handle order placement
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full p-0 bg-background gap-0 max-h-[90vh] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="p-4 sm:p-6 space-y-4 sm:space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <img
                src={kol.avatar || "/placeholder.svg"}
                alt=""
                className="w-12 h-12 rounded-full ring-2 ring-border"
              />
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {kol.name}
                  <a
                    href={`https://twitter.com/${kol.handle.slice(1)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </h2>
                <p className="text-muted-foreground">{kol.handle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.location.reload()}
              >
                <RefreshCcw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Info className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Chart Section */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <Card className="p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold flex items-center gap-2">
                      {kol.mindshare}%
                      <span
                        className={
                          activeTab === "long"
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        {activeTab === "long" ? <ChevronUp /> : <ChevronDown />}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last updated: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-start sm:justify-end gap-1">
                    {timeRanges.map((range) => (
                      <Button
                        key={range.value}
                        variant={
                          timeRange === range.value ? "secondary" : "ghost"
                        }
                        size="sm"
                        onClick={() => setTimeRange(range.value)}
                        className="text-xs px-2.5"
                      >
                        {range.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.1)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="time"
                        tickFormatter={(time) => {
                          const date = new Date(time);
                          return timeRange === "1h"
                            ? date.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : date.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              });
                        }}
                        stroke="#666"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="#666"
                        fontSize={12}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Market Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">24h Volume</span>
                  </div>
                  <div className="text-lg font-semibold">{kol.volume}</div>
                </Card>
                <Card className="p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Participants</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {kol.participants}
                  </div>
                </Card>
                <Card className="p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">Tweet Count</span>
                  </div>
                  <div className="text-lg font-semibold">{kol.tweetCount}</div>
                </Card>
                <Card className="p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <BarChart2 className="w-4 h-4" />
                    <span className="text-sm">Price Range</span>
                  </div>
                  <div className="text-lg font-semibold">30% - 70%</div>
                </Card>
              </div>
            </div>

            {/* Trading Interface */}
            <div className="space-y-4">
              <Card className="p-4 rounded-xl">
                <Tabs
                  value={activeTab}
                  onValueChange={(v: any) => setActiveTab(v)}
                >
                  <TabsList className="grid w-full grid-cols-2 mb-4 rounded-xl">
                    <TabsTrigger className="rounded-xl" value="long">
                      Long
                    </TabsTrigger>
                    <TabsTrigger className="rounded-xl" value="short">
                      Short
                    </TabsTrigger>
                  </TabsList>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="text-muted-foreground">
                          Balance: $1,000
                        </span>
                      </div>
                      <div className="flex space-x-2 ">
                        <Input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="flex-1 rounded-xl"
                        />
                        <Button
                          className="rounded-xl"
                          variant="outline"
                          size="sm"
                        >
                          Max
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[25, 50, 75, 100].map((percent) => (
                        <Button
                          key={percent}
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setAmount((1000 * (percent / 100)).toString())
                          }
                        >
                          {percent}%
                        </Button>
                      ))}
                    </div>
                    <Button
                      className={`w-full ${
                        activeTab === "long"
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-red-500 hover:bg-red-600"
                      } rounded-xl`}
                      disabled={isLoading}
                      onClick={handlePlaceOrder}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <RefreshCcw className="w-4 h-4 animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        `Place ${activeTab === "long" ? "Long" : "Short"}`
                      )}
                    </Button>
                  </div>
                </Tabs>
              </Card>

              <Card className="p-4 rounded-xl">
                <div className="flex items-center justify-between mb-4 ">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <h3 className="font-semibold">Order Book</h3>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <RefreshCcw className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                </div>
                <div className="space-y-1">
                  <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground mb-2">
                    <span>Price</span>
                    <span className="text-right">Size</span>
                    <span className="text-right">Total</span>
                  </div>
                  <div className="space-y-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <OrderBookEntry
                        key={`sell-${i}`}
                        price={40 - i * 0.5}
                        size={Math.floor(Math.random() * 1000)}
                        total={Math.floor(Math.random() * 10000)}
                        type="sell"
                      />
                    ))}
                    <div className="text-center py-2 font-medium border-y border-border my-2">
                      {kol.mindshare.toFixed(2)}%
                    </div>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <OrderBookEntry
                        key={`buy-${i}`}
                        price={39.5 - i * 0.5}
                        size={Math.floor(Math.random() * 1000)}
                        total={Math.floor(Math.random() * 10000)}
                        type="buy"
                      />
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
