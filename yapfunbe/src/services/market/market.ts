import { redis } from "../../config/cache";
import { CACHE_PREFIX, CACHE_TTL } from "../../config/cache";
import { Market, Position, Order, PricePoint } from "../../types/market";
import { contractService } from "../contract";
import { subgraphService } from "../subgraph";
import { errorHandler } from "../error";
import { analyticsService } from "../analytics";
import { notificationService } from "../notification";
import { validationService } from "../validation";

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

      // Update latest price
      await redis.setex(
        this.getMarketPriceKey(marketId),
        CACHE_TTL.MARKET,
        JSON.stringify(pricePoint)
      );

      // Update market data
      const market = await this.getMarket(marketId);
      if (market) {
        market.currentPrice = price;
        market.priceHistory.push(pricePoint);
        await redis.setex(
          this.getMarketKey(marketId),
          CACHE_TTL.MARKET,
          JSON.stringify(market)
        );
      }

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

      // Fetch from subgraph
      const positions = await subgraphService.getMarketPositions(marketId);
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
      // Update position cache
      const positions = await this.getMarketPositions(position.marketId);
      const index = positions.findIndex((p) => p.id === position.id);
      if (index >= 0) {
        positions[index] = position;
      } else {
        positions.push(position);
      }

      await redis.setex(
        this.getMarketPositionsKey(position.marketId),
        CACHE_TTL.POSITION,
        JSON.stringify(positions)
      );

      // Update market stats
      const market = await this.getMarket(position.marketId);
      if (market) {
        market.totalPositions = positions.length;
        await redis.setex(
          this.getMarketKey(position.marketId),
          CACHE_TTL.MARKET,
          JSON.stringify(market)
        );
      }
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
    } catch (error) {
      throw errorHandler.handle(error);
    }
  }

  // Price alerts
  private async checkPriceAlerts(
    marketId: string,
    price: number
  ): Promise<void> {
    try {
      const alertsKey = `${CACHE_PREFIX.MARKET}${marketId}:alerts`;
      const alerts = await redis.hgetall(alertsKey);

      for (const [userId, alertData] of Object.entries(alerts)) {
        const { condition, targetPrice } = JSON.parse(alertData);
        const targetPriceNum = parseFloat(targetPrice);

        if (
          (condition === "above" && price >= targetPriceNum) ||
          (condition === "below" && price <= targetPriceNum)
        ) {
          await notificationService.notifyPriceAlert(
            userId,
            marketId,
            price,
            condition
          );
          await redis.hdel(alertsKey, userId);
        }
      }
    } catch (error) {
      console.error("Error checking price alerts:", error);
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

      const alertsKey = `${CACHE_PREFIX.MARKET}${marketId}:alerts`;
      await redis.hset(
        alertsKey,
        userId,
        JSON.stringify({ targetPrice, condition })
      );
    } catch (error) {
      throw errorHandler.handle(error);
    }
  }

  async removePriceAlert(userId: string, marketId: string): Promise<void> {
    try {
      validationService.validateMarket(marketId);

      const alertsKey = `${CACHE_PREFIX.MARKET}${marketId}:alerts`;
      await redis.hdel(alertsKey, userId);
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
}

export const marketService = new MarketService();
