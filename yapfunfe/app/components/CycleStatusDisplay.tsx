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
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import { AlertTriangle, Clock } from "lucide-react";

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

// Function to format countdown time
const formatCountdown = (milliseconds: number) => {
  if (milliseconds <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  
  const seconds = Math.floor((milliseconds / 1000) % 60);
  const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
  const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);
  const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
  
  return { days, hours, minutes, seconds };
};

export default function CycleStatusDisplay() {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({ 
    days: 0, hours: 0, minutes: 0, seconds: 0 
  });
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { loading, error, data } = useQuery(GET_CYCLE_STATUS, {
    pollInterval: 30000, // Poll every 30 seconds
    onError: (error) => {
      console.error("Error fetching cycle status:", error);
      setErrorMessage(error.message || "Failed to fetch cycle status");
    },
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    if (!data?.cycleStatus) {
      if (data) {
        console.log("No cycle status data available:", data);
        setErrorMessage("No cycle data available. The cycle may not be initialized.");
      }
      return;
    }

    // Clear any previous error messages when we get valid data
    setErrorMessage(null);

    const { status, bufferEndTime, globalExpiry, isInBuffer } =
      data.cycleStatus;

    // Calculate time remaining and update every second
    const updateTimer = () => {
      const now = Date.now();
      let targetTime = isInBuffer ? bufferEndTime : globalExpiry;

      if (!targetTime) {
        setTimeRemaining("Not available");
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (!errorMessage) {
          setErrorMessage(isInBuffer ? 
            "Buffer end time is not available" : 
            "Global expiry time is not available");
        }
        return;
      }

      // Convert to number if it's a string
      targetTime =
        typeof targetTime === "string" ? parseInt(targetTime) : targetTime;

      // Calculate time remaining
      const remaining = Math.max(0, targetTime - now);
      
      // Update countdown object
      setCountdown(formatCountdown(remaining));

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

      // Format time remaining text
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
  }, [data, errorMessage]);

  // Render loading state
  if (loading && !data) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error && !data) {
    return (
      <Alert variant="destructive" className="w-full">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message || "Failed to load cycle status"}
        </AlertDescription>
      </Alert>
    );
  }

  // Render no cycle state
  if (!data?.cycleStatus) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2 text-center">
          <CardTitle className="text-lg font-medium">Market Cycle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className="text-amber-500 font-medium">No active market cycle</p>
              <p className="text-sm text-muted-foreground mt-2">
                The market cycle data is not available. This could be because:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside mx-auto max-w-xs">
                <li>The system is being initialized</li>
                <li>The backend is being redeployed</li>
                <li>There is a temporary connection issue</li>
              </ul>
              <div className="mt-4 flex justify-center">
                <div className="animate-pulse h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If we have an error message but also have data, show the data with an error alert
  const { status, isInBuffer, crashedOutKols } = data?.cycleStatus || {};
  const hasCrashedOutKols = crashedOutKols && crashedOutKols.length > 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          {isInBuffer ? "Next Cycle Starting" : "Current Cycle Status"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

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

          {/* Global Expiry Countdown Display */}
          <div className="mt-4">
            <div className="flex items-center justify-center gap-1 text-xs font-medium mb-2">
              <Clock className="h-3 w-3" />
              <span>Time until Global Expiry:</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-2">
                <div className="text-xl font-bold">{countdown.days}</div>
                <div className="text-xs text-muted-foreground">Days</div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-2">
                <div className="text-xl font-bold">{countdown.hours}</div>
                <div className="text-xs text-muted-foreground">Hours</div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-2">
                <div className="text-xl font-bold">{countdown.minutes}</div>
                <div className="text-xs text-muted-foreground">Minutes</div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-2">
                <div className="text-xl font-bold">{countdown.seconds}</div>
                <div className="text-xs text-muted-foreground">Seconds</div>
              </div>
            </div>
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
