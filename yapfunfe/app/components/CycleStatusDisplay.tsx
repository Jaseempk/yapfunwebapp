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
import { AlertTriangle, Clock, Hourglass } from "lucide-react";
import { motion } from "framer-motion";

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

const floatingAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

const glowAnimation = {
  boxShadow: [
    "0 0 10px rgba(0,255,0,0.2)",
    "0 0 20px rgba(0,255,0,0.3)",
    "0 0 10px rgba(0,255,0,0.2)"
  ],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

export default function CycleStatusDisplay() {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
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
        setErrorMessage(
          "No cycle data available. The cycle may not be initialized."
        );
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
          setErrorMessage(
            isInBuffer
              ? "Buffer end time is not available"
              : "Global expiry time is not available"
          );
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
      <motion.div
        animate={floatingAnimation}
        className="w-full max-w-2xl mx-auto"
      >
        <Card className="bg-background/95 backdrop-blur-sm">
          <CardContent className="py-6">
            <div className="flex items-center justify-center space-x-3">
              <Hourglass className="h-6 w-6 animate-spin text-primary" />
              <span className="text-base font-bold">Loading cycle status...</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Render error or null cycle state
  if (error || !data?.cycleStatus) {
    return (
      <motion.div
        animate={floatingAnimation}
        className="w-full max-w-2xl mx-auto"
      >
        <Card className="bg-background/95 backdrop-blur-sm border-red-500/20">
          <CardContent className="py-6">
            <div className="flex items-center justify-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <span className="text-base font-bold text-muted-foreground">
                {error ? "Failed to load cycle status" : "No active cycle"}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Main cycle status display
  const { status, isInBuffer, crashedOutKols } = data.cycleStatus;
  const hasCrashedOutKols = crashedOutKols && crashedOutKols.length > 0;

  return (
    <motion.div
      animate={floatingAnimation}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="bg-background/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold text-center">
            {isInBuffer ? "Next Cycle Starting" : "Current Cycle Status"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <motion.div 
            className="space-y-6"
            animate={glowAnimation}
          >
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">
                {isInBuffer ? "Buffer Period" : "Active Cycle"}
              </span>
              <span className="text-lg font-semibold text-muted-foreground">{status}</span>
            </div>

            <Progress value={progress} className="h-3" />

            <div className="text-center text-lg font-bold">
              {isInBuffer ? (
                <span className="text-amber-500">
                  Next cycle starts {timeRemaining}
                </span>
              ) : (
                <span>Cycle ends {timeRemaining}</span>
              )}
            </div>

            {/* Global Expiry Countdown Display */}
            <div className="mt-6">
              <div className="flex items-center justify-center gap-2 text-sm font-bold mb-3">
                <Clock className="h-5 w-5" />
                <span>Time until Global Expiry:</span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="bg-secondary/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-3xl font-extrabold">{countdown.days}</div>
                  <div className="text-sm font-bold text-muted-foreground">Days</div>
                </div>
                <div className="bg-secondary/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-3xl font-extrabold">{countdown.hours}</div>
                  <div className="text-sm font-bold text-muted-foreground">Hours</div>
                </div>
                <div className="bg-secondary/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-3xl font-extrabold">{countdown.minutes}</div>
                  <div className="text-sm font-bold text-muted-foreground">Minutes</div>
                </div>
                <div className="bg-secondary/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-3xl font-extrabold">{countdown.seconds}</div>
                  <div className="text-sm font-bold text-muted-foreground">Seconds</div>
                </div>
              </div>
            </div>

            {isInBuffer && (
              <div className="text-sm font-bold text-center text-amber-500 mt-4">
                Trading is paused during the buffer period
              </div>
            )}

            {/* Crashed Out KOLs Section */}
            {hasCrashedOutKols && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                <h4 className="text-lg font-bold mb-3">
                  Crashed Out KOLs ({crashedOutKols.length})
                </h4>
                <div className="max-h-48 overflow-y-auto">
                  <ul className="space-y-3">
                    {crashedOutKols.map((kol: any) => (
                      <li key={kol.id} className="text-sm">
                        <div className="flex justify-between">
                          <span className="font-bold">
                            {kol.username || `KOL #${kol.id}`}
                          </span>
                          <span className="font-semibold text-muted-foreground">
                            {new Date(
                              parseInt(kol.crashedOutAt)
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="font-medium text-muted-foreground truncate">
                          Market: {kol.marketAddress.substring(0, 8)}...
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                {isInBuffer && (
                  <div className="text-sm font-bold text-amber-500 mt-3">
                    Mindshare data for crashed out KOLs is being preserved
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
