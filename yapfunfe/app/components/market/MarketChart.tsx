import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";
import { TooltipProps } from "recharts";
import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";

const timeRanges = [
  { label: "1H", value: "1h" },
  { label: "6H", value: "6h" },
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
  { label: "1M", value: "1m" },
  { label: "ALL", value: "all" },
] as const;

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  type: "long" | "short";
}

const CustomTooltip = ({
  active,
  payload,
  label,
  type,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border p-3 sm:p-4 rounded-lg shadow-lg min-w-[120px] touch-none">
        <p className="text-xs sm:text-sm font-medium mb-1">
          {label &&
            new Date(label).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
            })}
        </p>
        <p className="text-base sm:text-lg font-semibold flex items-center gap-1.5">
          <span className={type === "long" ? "text-green-500" : "text-red-500"}>
            {payload[0]?.value != null
              ? typeof payload[0].value === "number"
                ? `${payload[0].value.toFixed(2)}%`
                : payload[0].value
              : "N/A"}
          </span>
          {type === "long" ? (
            <ChevronUp className="w-4 h-4 text-green-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-red-500" />
          )}
        </p>
      </div>
    );
  }
  return null;
};

interface MarketChartProps {
  mindshare: number;
  timeRange: (typeof timeRanges)[number]["value"];
  activeTab: "long" | "short";
  onTimeRangeChange: (range: (typeof timeRanges)[number]["value"]) => void;
  className?: string;
}

// Generate mock chart data relative to the KOL's mindshare
const generateChartData = (timeRange: string, baseMindshare: number) => {
  const points =
    {
      "1h": 60,
      "6h": 120,
      "1d": 240,
      "1w": 336,
      "1m": 480,
      all: 600,
    }[timeRange] || 240;

  const interval =
    {
      "1h": 60000, // 1 minute
      "6h": 360000, // 6 minutes
      "1d": 900000, // 15 minutes
      "1w": 3600000, // 1 hour
      "1m": 14400000, // 4 hours
      all: 28800000, // 8 hours
    }[timeRange] || 900000;
  
  // Calculate a reasonable range for fluctuations based on mindshare
  // Lower mindshare values should have higher volatility
  const volatilityFactor = Math.max(0.5, Math.min(2, 5 / Math.max(0.1, baseMindshare)));
  const maxFluctuation = baseMindshare * 0.2 * volatilityFactor; // 20% of mindshare value
  
  // Generate a realistic trend with some randomness
  let trend = 0;
  const trendStrength = 0.7; // How strongly the trend influences the next value
  const trendReversion = 0.05; // How quickly the trend reverts to zero
  
  return Array.from({ length: points }, (_, i) => {
    // Update trend with some randomness and mean reversion
    trend = trend * (1 - trendReversion) + (Math.random() - 0.5) * maxFluctuation * 0.4;
    
    // Calculate value based on trend and some randomness
    const randomFactor = Math.random() * maxFluctuation - maxFluctuation / 2;
    const sinFactor = Math.sin(i / 20) * maxFluctuation * 0.3;
    
    // Combine factors for a realistic looking chart
    const value = baseMindshare + trend + randomFactor + sinFactor;
    
    return {
      time: new Date(Date.now() - (points - i) * interval).toISOString(),
      value: Math.max(0.001, value), // Ensure value doesn't go negative
    };
  });
};

export default function MarketChart({
  mindshare,
  timeRange,
  activeTab,
  onTimeRangeChange,
  className,
}: MarketChartProps) {
  const chartData = useMemo(() => generateChartData(timeRange, mindshare), [timeRange, mindshare]);

  return (
    <Card className={`p-4 sm:p-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${className || ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <div className="space-y-1 animate-in slide-in-from-left duration-500">
          <div className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            {mindshare.toFixed(4)}%
            <span
              className={
                activeTab === "long" ? "text-green-500" : "text-red-500"
              }
            >
              {activeTab === "long" ? (
                <ChevronUp className="w-5 h-5" aria-label="Trending up" />
              ) : (
                <ChevronDown className="w-5 h-5" aria-label="Trending down" />
              )}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto animate-in slide-in-from-right duration-500">
          {timeRanges.map((range) => (
            <Button
              key={range.value}
              variant={timeRange === range.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onTimeRangeChange(range.value)}
              className="text-[10px] sm:text-xs h-8 sm:h-9 px-2 sm:px-3 flex-1 sm:flex-none rounded-xl min-w-[40px]"
              aria-label={`Show ${range.label} chart`}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="h-[30vh] sm:h-[35vh] min-h-[180px] sm:min-h-[250px] max-h-[400px] -mx-2 sm:mx-0 touch-pan-y animate-in fade-in duration-700 delay-300">
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
              fontSize={8}
              height={20}
              dy={5}
              tickMargin={8}
            />
            <YAxis
              stroke="#666"
              fontSize={8}
              tickFormatter={(value) => `${value}%`}
              width={30}
              tickMargin={4}
            />
            <Tooltip
              content={(props) => <CustomTooltip {...props} type={activeTab} />}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={activeTab === "long" ? "#22c55e" : "#ef4444"}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              style={{ touchAction: "pan-y pinch-zoom" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
