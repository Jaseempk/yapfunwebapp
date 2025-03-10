"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { formatDistanceToNow } from "date-fns";

// GraphQL query to get cycle status
const GET_CYCLE_STATUS = gql`
  query GetCycleStatus {
    cycleStatus {
      status
      bufferEndTime
      globalExpiry
      isInBuffer
      crashedOutKols {
        id
        username
        marketAddress
        crashedOutAt
      }
    }
  }
`;

export default function CycleStatusDisplay() {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);

  const { loading, error, data } = useQuery(GET_CYCLE_STATUS, {
    pollInterval: 30000, // Poll every 30 seconds
  });

  useEffect(() => {
    if (!data?.cycleStatus) return;

    const { status, bufferEndTime, globalExpiry, isInBuffer } =
      data.cycleStatus;

    // Calculate time remaining and update every second
    const updateTimer = () => {
      const now = Date.now();
      let targetTime = isInBuffer ? bufferEndTime : globalExpiry;

      if (!targetTime) return;

      // Convert to number if it's a string
      targetTime =
        typeof targetTime === "string" ? parseInt(targetTime) : targetTime;

      // Calculate time remaining
      const remaining = Math.max(0, targetTime - now);

      // Calculate progress percentage
      let progressValue = 0;
      if (isInBuffer) {
        // For buffer period (1 hour)
        const bufferDuration = 60 * 60 * 1000; // 1 hour in ms
        progressValue = 100 - (remaining / bufferDuration) * 100;
      } else {
        // For active cycle (72 hours)
        const cycleDuration = 72 * 60 * 60 * 1000; // 72 hours in ms
        progressValue = 100 - (remaining / cycleDuration) * 100;
      }

      setProgress(Math.min(100, Math.max(0, progressValue)));

      // Format time remaining
      if (remaining > 0) {
        setTimeRemaining(
          formatDistanceToNow(new Date(targetTime), { addSuffix: true })
        );
      } else {
        setTimeRemaining(
          isInBuffer ? "Starting new cycle..." : "Ending cycle..."
        );
      }
    };

    // Update immediately and then every second
    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [data]);

  if (loading)
    return <div className="animate-pulse">Loading cycle status...</div>;
  if (error)
    return <div className="text-red-500">Error loading cycle status</div>;
  if (!data?.cycleStatus) return null;

  const { status, isInBuffer, crashedOutKols } = data.cycleStatus;
  const hasCrashedOutKols = crashedOutKols && crashedOutKols.length > 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          {isInBuffer ? "Next Cycle Starting" : "Current Cycle Status"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {isInBuffer ? "Buffer Period" : "Active Cycle"}
            </span>
            <span className="text-sm text-muted-foreground">{status}</span>
          </div>

          <Progress value={progress} className="h-2" />

          <div className="text-center text-sm font-medium">
            {isInBuffer ? (
              <span className="text-amber-500">
                Next cycle starts {timeRemaining}
              </span>
            ) : (
              <span>Cycle ends {timeRemaining}</span>
            )}
          </div>

          {isInBuffer && (
            <div className="text-xs text-center text-muted-foreground mt-2">
              Trading is paused during the buffer period
            </div>
          )}

          {/* Crashed Out KOLs Section */}
          {hasCrashedOutKols && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <h4 className="text-sm font-medium mb-2">
                Crashed Out KOLs ({crashedOutKols.length})
              </h4>
              <div className="max-h-40 overflow-y-auto">
                <ul className="space-y-2">
                  {crashedOutKols.map((kol: any) => (
                    <li key={kol.id} className="text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {kol.username || `KOL #${kol.id}`}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(
                            parseInt(kol.crashedOutAt)
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-muted-foreground truncate">
                        Market: {kol.marketAddress.substring(0, 8)}...
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              {isInBuffer && (
                <div className="text-xs text-amber-500 mt-2">
                  Mindshare data for crashed out KOLs is being preserved
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
