import { EventEmitter } from "events";
import { errorHandler } from "../error";

export enum MarketEventType {
  PRICE_UPDATE = "PRICE_UPDATE",
  TRADE = "TRADE",
  POSITION_UPDATE = "POSITION_UPDATE",
  LIQUIDATION = "LIQUIDATION",
  MARKET_DEPLOYED = "MARKET_DEPLOYED",
  MARKET_DEPLOYMENT_FAILED = "MARKET_DEPLOYMENT_FAILED",
}

interface MarketDeploymentData {
  kolId: string;
  marketAddress: string;
  kolName: string;
  timestamp: string;
  mindshare: number;
  rank: string;
}

interface MarketDeploymentFailedData {
  kolId: string;
  error: string;
  timestamp: number;
}

interface MarketEvent {
  type: MarketEventType;
  data: MarketDeploymentData | MarketDeploymentFailedData | any;
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

  public emit(
    event: MarketEventType.MARKET_DEPLOYED,
    data: MarketDeploymentData
  ): boolean;
  public emit(
    event: MarketEventType.MARKET_DEPLOYMENT_FAILED,
    data: MarketDeploymentFailedData
  ): boolean;
  public emit(event: MarketEventType, data: any): boolean;
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
