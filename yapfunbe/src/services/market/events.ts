import { EventEmitter } from "events";
import { errorHandler } from "../error";

export enum MarketEventType {
  PRICE_UPDATE = "PRICE_UPDATE",
  TRADE = "TRADE",
  POSITION_UPDATE = "POSITION_UPDATE",
  LIQUIDATION = "LIQUIDATION",
}

interface MarketEvent {
  type: MarketEventType;
  data: any;
  timestamp: number;
}

class MarketEventEmitter extends EventEmitter {
  private static instance: MarketEventEmitter;

  private constructor() {
    super();
  }

  public static getInstance(): MarketEventEmitter {
    if (!MarketEventEmitter.instance) {
      MarketEventEmitter.instance = new MarketEventEmitter();
    }
    return MarketEventEmitter.instance;
  }

  public emit(event: MarketEventType, data: any): boolean {
    const marketEvent: MarketEvent = {
      type: event,
      data,
      timestamp: Date.now(),
    };
    return super.emit(event, marketEvent);
  }

  public subscribe(
    event: MarketEventType,
    callback: (event: MarketEvent) => void
  ): void {
    try {
      this.on(event, callback);
    } catch (error) {
      console.error(`Error subscribing to ${event}:`, error);
      throw errorHandler.handle(error);
    }
  }

  public unsubscribe(
    event: MarketEventType,
    callback: (event: MarketEvent) => void
  ): void {
    try {
      this.removeListener(event, callback);
    } catch (error) {
      console.error(`Error unsubscribing from ${event}:`, error);
      throw errorHandler.handle(error);
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const testEvent = "TEST_EVENT";
      let received = false;

      const testCallback = () => {
        received = true;
      };

      this.once(testEvent, testCallback);
      this.emit(testEvent as MarketEventType, { test: true });

      return received;
    } catch (error) {
      console.error("Market events health check failed:", error);
      return false;
    }
  }
}

export const marketEvents = MarketEventEmitter.getInstance();
