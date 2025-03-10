import { Card } from "../../components/ui/card";
import { Clock, Users, MessageSquare, BarChart2 } from "lucide-react";

interface MarketStatsProps {
  volume: string;
  participants: number;
  tweetCount: number;
  priceRange?: {
    min: number;
    max: number;
  };
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

const StatCard = ({ icon, label, value }: StatCardProps) => (
  <Card className="p-3 sm:p-4 rounded-xl">
    <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground mb-2 sm:mb-3">
      {icon}
      <span className="text-xs sm:text-sm">{label}</span>
    </div>
    <div className="text-base sm:text-lg font-semibold">{value}</div>
  </Card>
);

export default function MarketStats({
  volume,
  participants,
  tweetCount,
  priceRange = { min: 30, max: 70 },
}: MarketStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
      <StatCard
        icon={<Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        label="24h Volume"
        value={volume}
      />
      <StatCard
        icon={<Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        label="Participants"
        value={participants}
      />
      <StatCard
        icon={<MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        label="Tweet Count"
        value={tweetCount}
      />
      <StatCard
        icon={<BarChart2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        label="Price Range"
        value={`${priceRange.min}% - ${priceRange.max}%`}
      />
    </div>
  );
}
