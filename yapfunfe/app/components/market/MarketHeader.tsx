import { Button } from "@/components/ui/button";
import { Clock, ExternalLink, Info, RefreshCcw } from "lucide-react";
import ExpiryTimer from "../ExpiryTimer";

interface MarketHeaderProps {
  name: string;
  handle: string;
  avatar: string;
  marketAddress?: `0x${string}`;
  startTime?: number;
  onRefresh: () => void;
}

export default function MarketHeader({
  name,
  handle,
  avatar,
  marketAddress,
  startTime,
  onRefresh,
}: MarketHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10 pb-2">
      <div className="flex items-center space-x-4">
        <img
          src={avatar || "/placeholder.svg"}
          alt={`${name}'s avatar`}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full ring-2 ring-border"
        />
        <div className="flex flex-col">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            {name}
            <a
              href={`https://twitter.com/${handle.slice(1)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
              aria-label={`Visit ${name}'s Twitter profile`}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </h2>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">{handle}</p>
            {startTime && marketAddress && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <ExpiryTimer startTime={startTime} className="text-xs" />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          aria-label="Refresh data"
        >
          <RefreshCcw className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Show information">
          <Info className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
