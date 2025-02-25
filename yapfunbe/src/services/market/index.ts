import { marketEvents } from "./events";
import { kolOrderbookService } from "./kolOrderbook";
import { MarketEventType } from "./events";

export { kolOrderbookService };

// Market service initialization
export async function initializeMarketServices(): Promise<void> {
  try {
    // Subscribe to market events
    marketEvents.subscribe(MarketEventType.PRICE_UPDATE, (event) => {
      console.log("Price update event:", event);
    });

    marketEvents.subscribe(MarketEventType.TRADE, (event) => {
      console.log("Trade event:", event);
    });

    marketEvents.subscribe(MarketEventType.POSITION_UPDATE, (event) => {
      console.log("Position update event:", event);
    });

    marketEvents.subscribe(MarketEventType.LIQUIDATION, (event) => {
      console.log("Liquidation event:", event);
    });

    console.log("Market services initialized");
  } catch (error) {
    console.error("Error initializing market services:", error);
    throw error;
  }
}
