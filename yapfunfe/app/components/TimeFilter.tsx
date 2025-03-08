"use client";

import { Button } from "@/components/ui/button";

const timeRanges = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "3M", value: "3m" },
  { label: "6M", value: "6m" },
  { label: "12M", value: "12m" },
];

export default function TimeFilter({
  active = "7d",
  onChange,
}: {
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center space-x-1 bg-background/50 backdrop-blur-sm rounded-xl p-0.5 sm:p-1 border border-border/50">
      <div className="flex items-center space-x-0.5 sm:space-x-1 overflow-x-auto no-scrollbar touch-pan-x">
        {timeRanges.map((range) => (
          <Button
            key={range.value}
            variant={active === range.value ? "secondary" : "ghost"}
            size="sm"
            className={`text-xs font-medium rounded-xl px-2 sm:px-3 h-7 sm:h-8 min-w-[36px] sm:min-w-[40px] ${
              active === range.value
                ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-400"
                : "hover:bg-background/70"
            }`}
            onClick={() => onChange(range.value)}
          >
            {range.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
