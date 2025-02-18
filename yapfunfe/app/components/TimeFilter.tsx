"use client"

import { Button } from "@/components/ui/button"

const timeRanges = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "3M", value: "3m" },
  { label: "6M", value: "6m" },
  { label: "12M", value: "12m" },
]

export default function TimeFilter({
  active = "30d",
  onChange,
}: { active: string; onChange: (value: string) => void }) {
  return (
    <div className="flex items-center space-x-1 bg-gray-800/50 rounded-lg p-1">
      {timeRanges.map((range) => (
        <Button
          key={range.value}
          variant={active === range.value ? "secondary" : "ghost"}
          size="sm"
          className="text-xs font-medium"
          onClick={() => onChange(range.value)}
        >
          {range.label}
        </Button>
      ))}
    </div>
  )
}

