import { marketEvents } from "./events";
import { kolOrderbookService } from "./kolOrderbook";
import { MarketEventType } from "./events";
import { getMarketDeploymentService } from "./deployment";
import { kolService } from "../kol";
import { getWebSocketService } from "../websocket";
import { errorHandler } from "../error";

export { kolOrderbookService };

// Market service initialization
export async function initializeMarketServices(): Promise<void> {
  try {
    // Get market deployment service instance
    const marketDeploymentService = getMarketDeploymentService();

    const wsService = getWebSocketService();

    // Subscribe to market events
    marketEvents.subscribe(MarketEventType.PRICE_UPDATE, (event) => {
      wsService.broadcast(`market:${event.data.marketId}:price`, event.data);
    });

    marketEvents.subscribe(MarketEventType.TRADE, (event) => {
      wsService.broadcast(`market:${event.data.marketId}:trade`, event.data);
      wsService.broadcastToUser(event.data.trader, "trade_update", event.data);
    });

    marketEvents.subscribe(MarketEventType.POSITION_UPDATE, (event) => {
      wsService.broadcast(`market:${event.data.marketId}:position`, event.data);
      if (event.data.trader) {
        wsService.broadcastToUser(
          event.data.trader,
          "position_update",
          event.data
        );
      }
    });

    marketEvents.subscribe(MarketEventType.LIQUIDATION, (event) => {
      wsService.broadcast(
        `market:${event.data.marketId}:liquidation`,
        event.data
      );
      wsService.broadcastToUser(event.data.trader, "liquidation", event.data);
    });

    marketEvents.subscribe(MarketEventType.MARKET_DEPLOYED, (event) => {
      wsService.broadcast("market:deployed", event.data);
    });

    marketEvents.subscribe(
      MarketEventType.MARKET_DEPLOYMENT_FAILED,
      (event) => {
        console.error("Market deployment failed:", event.data);
        wsService.broadcast("market:deployment_failed", event.data);
      }
    );

    // Setup market deployment event listener
    marketDeploymentService.setupEventListeners(async (event) => {
      try {
        const kolId = event.args.kolId;
        const marketAddress = event.args.marketAddy;
        const kol = await kolService.getKOL(kolId);

        if (!kol) {
          throw new Error(`KOL not found for id ${kolId}`);
        }

        const deploymentData = {
          kolId,
          marketAddress,
          kolName: kol.name || kolId,
          timestamp: new Date().toISOString(),
          mindshare: kol.mindshare || 0,
          rank: kol.rank || "0",
        };

        marketEvents.emit(MarketEventType.MARKET_DEPLOYED, deploymentData);
        wsService.broadcast("market:deployed", deploymentData);
      } catch (error) {
        console.error("Error handling market deployment event:", error);
        errorHandler.handle(error);
      }
    });

    console.log("Market services initialized");
  } catch (error) {
    console.error("Error initializing market services:", error);
    throw error;
  }
}
