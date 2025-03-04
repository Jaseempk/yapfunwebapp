import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMarketEvents } from "../hooks/useMarketEvents";
import { Address } from "viem";

interface MarketEventNotificationProps {
  marketAddress?: Address;
  userAddress?: Address;
}

export default function MarketEventNotification({
  marketAddress,
  userAddress,
}: MarketEventNotificationProps) {
  const { toast } = useToast();
  const { recentEvents } = useMarketEvents(marketAddress, userAddress);

  useEffect(() => {
    if (!recentEvents.length) return;

    const latestEvent = recentEvents[0];
    let title = "";
    let description = "";

    switch (latestEvent.type) {
      case "order_created":
        const { isLong, mindshareValue, quantity } = latestEvent.data;
        title = `New ${isLong ? "Long" : "Short"} Position`;
        description = `Position opened at ${
          Number(mindshareValue) / 1e6
        }% for ${Number(quantity) / 1e6} USDC`;
        break;
      case "position_closed":
        const { pnl } = latestEvent.data;
        const pnlValue = Number(pnl) / 1e6;
        title = "Position Closed";
        description = `Position closed with ${
          pnlValue >= 0 ? "profit" : "loss"
        } of ${Math.abs(pnlValue)} USDC`;
        break;
      case "market_reset":
        title = "Market Reset";
        description = "Market has been reset for the new cycle";
        break;
    }

    if (title) {
      toast({
        title,
        description,
        duration: 5000,
      });
    }
  }, [recentEvents, toast]);

  return null;
}
