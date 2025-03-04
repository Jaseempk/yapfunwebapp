import { useEffect, useState } from "react";

interface ExpiryTimerProps {
  startTime: number;
  className?: string;
}

const CYCLE_DURATION = 72 * 60 * 60 * 1000; // 72 hours in milliseconds
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const ExpiryTimer = ({ startTime, className = "" }: ExpiryTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const endTime = startTime + CYCLE_DURATION;
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      if (diff < DAY) {
        // Less than 24 hours, show in hours
        const hours = Math.ceil(diff / HOUR);
        setTimeLeft(`${hours} hour${hours > 1 ? "s" : ""}`);
      } else {
        // More than 24 hours, show in days
        const days = Math.ceil(diff / DAY);
        setTimeLeft(`${days} day${days > 1 ? "s" : ""}`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className={`text-sm ${className}`}>
      <span className="text-muted-foreground">Expires in: </span>
      <span className="font-medium">{timeLeft}</span>
    </div>
  );
};

export default ExpiryTimer;
