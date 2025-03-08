import { redis } from "../../config/cache";
import { CACHE_PREFIX, CACHE_TTL } from "../../config/cache";
import {
  Market,
  Position,
  Order,
  PricePoint,
  PositionType,
  PositionStatus,
} from "../../types/market";
import { contractService } from "../contract";
import { subgraphService } from "../subgraph";
import { errorHandler } from "../error";
import { analyticsService } from "../analytics";
import { notificationService } from "../notification";
import { validationService } from "../validation";
import { getWebSocketService } from "../websocket";

interface PriceAlert {
  targetPrice: number;
  condition: "above" | "below";
}

export class MarketService {
  // Cache keys
  private getMarketKey(marketId: string): string {
    return `${CACHE_PREFIX.MARKET}${marketId}`;
  }

  private getMarketPriceKey(marketId: string): string {
    return `${CACHE_PREFIX.MARKET}${marketId}:price`;
  }

  private getMarketPositionsKey(marketId: string): string {
    return `${CACHE_PREFIX.MARKET}${marketId}:positions`;
  }

  private getMarketOrdersKey(marketId: string): string {
    return `${CACHE_PREFIX.MARKET}${marketId}:orders`;
  }

  private getMarketAlertsKey(marketId: string): string {
    return `${CACHE_PREFIX.MARKET}${marketId}:alerts`;
  }

  // Market operations
  async getMarket(marketId: string): Promise<Market | null> {
    try {
      validationService.validateMarket(marketId);

      // Try cache first
      const cachedMarket = await redis.get(this.getMarketKey(marketId));
      if (cachedMarket) {
        return JSON.parse(cachedMarket);
      }

      // Fetch from contract/subgraph
      const market = await contractService.getMarketData(marketId);
      if (market) {
        await redis.setex(
          this.getMarketKey(marketId),
          CACHE_TTL.MARKET,
          JSON.stringify(market)
        );
      }

      return market;
    } catch (error) {
      throw errorHandler.handle(error);
    }
  }

  async updateMarketPrice(
    marketId: string,
    price: number,
    timestamp: string
  ): Promise<void> {
    try {
      validationService.validateMarket(marketId);
      validationService.validatePrice(price);

      const pricePoint: PricePoint = { price, timestamp };
      const wsService = getWebSocketService();

      // Use pipeline for atomic updates
      const pipeline = redis.pipeline();

      // Update latest price
      pipeline.setex(
        this.getMarketPriceKey(marketId),
        CACHE_TTL.MARKET,
        JSON.stringify(pricePoint)
      );

      // Update market data
      const market = await this.getMarket(marketId);
      if (market) {
        market.currentPrice = price;
        market.priceHistory.push(pricePoint);
        pipeline.setex(
          this.getMarketKey(marketId),
          CACHE_TTL.MARKET,
          JSON.stringify(market)
        );
      }

      // Execute pipeline
      await pipeline.exec();

      // Broadcast price update
      await wsService.broadcast(`market:${marketId}:price`, pricePoint);

      // Update analytics
      await analyticsService.trackMarketTrade(marketId, 0, price, "");

      // Check and notify price alerts
      await this.checkPriceAlerts(marketId, price);
    } catch (error) {
      throw errorHandler.handle(error);
    }
  }

  // Position operations
  async getMarketPositions(marketId: string): Promise<Position[]> {
    try {
      validationService.validateMarket(marketId);

      // Try cache first
      const cachedPositions = await redis.get(
        this.getMarketPositionsKey(marketId)
      );
      if (cachedPositions) {
        return JSON.parse(cachedPositions);
      }

      // Since subgraphService.getMarketPositions has been removed, we'll use contractService instead
      const orders = await contractService.getMarketOrders(marketId);
      const positions: Position[] = orders
        .filter((order) => order.status === "FILLED") // Only consider filled orders as positions
        .map((order) => ({
          id: order.id,
          marketId: order.marketId,
          trader: order.trader,
          amount: order.amount,
          entryPrice: order.price,
          type: order.type === "LIMIT" ? PositionType.LONG : PositionType.SHORT, // Simplified mapping
          status: PositionStatus.CLOSED,
          pnl: 0, // Not available here
          createdAt: order.createdAt,
          closedAt: order.updatedAt,
        }));

      if (positions.length > 0) {
        await redis.setex(
          this.getMarketPositionsKey(marketId),
          CACHE_TTL.POSITION,
          JSON.stringify(positions)
        );
      }

      return positions;
    } catch (error) {
      throw errorHandler.handle(error);
    }
  }

  async updatePosition(position: Position): Promise<void> {
    try {
      const wsService = getWebSocketService();
      const pipeline = redis.pipeline();

      // Update position cache
      const positions = await this.getMarketPositions(position.marketId);
      const index = positions.findIndex((p) => p.id === position.id);
      if (index >= 0) {
        positions[index] = position;
      } else {
        positions.push(position);
      }

      pipeline.setex(
        this.getMarketPositionsKey(position.marketId),
        CACHE_TTL.POSITION,
        JSON.stringify(positions)
      );

      // Update market stats
      const market = await this.getMarket(position.marketId);
      if (market) {
        market.totalPositions = positions.length;
        pipeline.setex(
          this.getMarketKey(position.marketId),
          CACHE_TTL.MARKET,
          JSON.stringify(market)
        );
      }

      // Execute pipeline
      await pipeline.exec();

      // Broadcast position update
      await wsService.broadcast(
        `market:${position.marketId}:position`,
        position
      );
      await wsService.broadcastToUser(
        position.trader,
        "position_update",
        position
      );
    } catch (error) {
      throw errorHandler.handle(error);
    }
  }

  // Order operations
  async getMarketOrders(marketId: string): Promise<Order[]> {
    try {
      validationService.validateMarket(marketId);

      // Try cache first
      const cachedOrders = await redis.get(this.getMarketOrdersKey(marketId));
      if (cachedOrders) {
        return JSON.parse(cachedOrders);
      }

      // Fetch from contract
      const orders = await contractService.getMarketOrders(marketId);
      if (orders.length > 0) {
        await redis.setex(
          this.getMarketOrdersKey(marketId),
          CACHE_TTL.POSITION,
          JSON.stringify(orders)
        );
      }

      return orders;
    } catch (error) {
      throw errorHandler.handle(error);
    }
  }

  async updateOrder(order: Order): Promise<void> {
    try {
      const wsService = getWebSocketService();

      // Update order cache
      const orders = await this.getMarketOrders(order.marketId);
      const index = orders.findIndex((o) => o.id === order.id);
      if (index >= 0) {
        orders[index] = order;
      } else {
        orders.push(order);
      }

      await redis.setex(
        this.getMarketOrdersKey(order.marketId),
        CACHE_TTL.POSITION,
        JSON.stringify(orders)
      );

      // Broadcast order update
      await wsService.broadcast(`market:${order.marketId}:order`, order);
      await wsService.broadcastToUser(order.trader, "order_update", order);
    } catch (error) {
      throw errorHandler.handle(error);
    }
  }

  // Price alerts
  private async checkPriceAlerts(
    marketId: string,
    currentPrice: number
  ): Promise<void> {
    try {
      const alertsKey = this.getMarketAlertsKey(marketId);
      const alerts = await redis.hgetall(alertsKey);
      const pipeline = redis.pipeline();
      const wsService = getWebSocketService();

      for (const [userId, alertData] of Object.entries(alerts)) {
        const alert = JSON.parse(alertData) as PriceAlert;
        const targetPrice = alert.targetPrice;

        if (
          (alert.condition === "above" && currentPrice >= targetPrice) ||
          (alert.condition === "below" && currentPrice <= targetPrice)
        ) {
          // Remove triggered alert
          pipeline.hdel(alertsKey, userId);

          // Send notifications
          await Promise.all([
            notificationService.notifyPriceAlert(
              marketId,
              currentPrice,
              targetPrice,
              alert.condition
            ),
            wsService.broadcastToUser(userId, "price_alert", {
              marketId,
              currentPrice,
              targetPrice,
              condition: alert.condition,
            }),
          ]);
        }
      }

      await pipeline.exec();
    } catch (error) {
      console.error("Error checking price alerts:", error);
      errorHandler.handle(error);
    }
  }

  async setPriceAlert(
    userId: string,
    marketId: string,
    targetPrice: number,
    condition: "above" | "below"
  ): Promise<void> {
    try {
      validationService.validateMarket(marketId);
      validationService.validatePrice(targetPrice);

      const alert: PriceAlert = { targetPrice, condition };
      const alertsKey = this.getMarketAlertsKey(marketId);

      await redis.hset(alertsKey, userId, JSON.stringify(alert));
    } catch (error) {
      throw errorHandler.handle(error);
    }
  }

  async removePriceAlert(userId: string, marketId: string): Promise<void> {
    try {
      validationService.validateMarket(marketId);
      await redis.hdel(this.getMarketAlertsKey(marketId), userId);
    } catch (error) {
      throw errorHandler.handle(error);
    }
  }

  // Cleanup methods
  async clearMarketCache(marketId: string): Promise<void> {
    try {
      const keys = await redis.keys(`${CACHE_PREFIX.MARKET}${marketId}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      throw errorHandler.handle(error);
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const testKey = `${CACHE_PREFIX.MARKET}health`;
      await redis.setex(testKey, 5, "1");
      const result = await redis.get(testKey);
      await redis.del(testKey);
      return result === "1";
    } catch (error) {
      console.error("Market service health check failed:", error);
      return false;
    }
  }
}

export const marketService = new MarketService();
