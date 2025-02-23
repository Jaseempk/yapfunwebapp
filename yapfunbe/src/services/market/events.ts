import { ethers } from "ethers";
import {
  Market,
  Position,
  Order,
  OrderStatus,
  PositionStatus,
  OrderType,
  PositionType,
} from "../../types/market";
import { marketService } from "./market";
import { contractService } from "../contract";
import { notificationService } from "../notification";
import { analyticsService } from "../analytics";
import {
  publishMarketPriceUpdate,
  publishPositionUpdate,
  publishOrderUpdate,
} from "../../graphql/resolvers/market";

export class MarketEventHandler {
  private readonly provider: ethers.JsonRpcProvider;
  private readonly RPC_URL = process.env.RPC_URL || "http://localhost:8545";
  private eventSubscriptions: Map<string, ethers.Contract> = new Map();

  constructor() {
    this.provider = new ethers.JsonRpcProvider(this.RPC_URL);
  }

  async subscribeToMarketEvents(marketId: string): Promise<void> {
    if (this.eventSubscriptions.has(marketId)) {
      return;
    }

    try {
      // Subscribe to market events
      const contract = await this.getMarketContract(marketId);

      // Price update events
      contract.on("PriceUpdated", async (price: bigint, timestamp: bigint) => {
        const priceNumber = Number(price) / 1e18; // Assuming 18 decimals
        const timestampStr = new Date(Number(timestamp) * 1000).toISOString();

        await this.handlePriceUpdate(marketId, priceNumber, timestampStr);
      });

      // Position events
      contract.on(
        "PositionOpened",
        async (
          positionId: string,
          trader: string,
          amount: bigint,
          leverage: bigint,
          entryPrice: bigint
        ) => {
          const position: Position = {
            id: positionId,
            marketId,
            trader,
            amount: Number(amount) / 1e18,
            entryPrice: Number(entryPrice) / 1e18,
            type: Number(leverage) > 0 ? PositionType.LONG : PositionType.SHORT,
            status: PositionStatus.OPEN,
            createdAt: new Date().toISOString(),
          };

          await this.handlePositionOpen(position);
        }
      );

      contract.on("PositionClosed", async (positionId: string, pnl: bigint) => {
        await this.handlePositionClose(
          marketId,
          positionId,
          Number(pnl) / 1e18
        );
      });

      contract.on("PositionLiquidated", async (positionId: string) => {
        await this.handlePositionLiquidation(marketId, positionId);
      });

      // Order events
      contract.on(
        "OrderCreated",
        async (
          orderId: string,
          trader: string,
          amount: bigint,
          price: bigint,
          orderType: number
        ) => {
          const order: Order = {
            id: orderId,
            marketId,
            trader,
            amount: Number(amount) / 1e18,
            price: Number(price) / 1e18,
            type: orderType === 0 ? OrderType.LIMIT : OrderType.MARKET,
            status: OrderStatus.OPEN,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await this.handleOrderCreation(order);
        }
      );

      contract.on("OrderFilled", async (orderId: string, fillPrice: bigint) => {
        await this.handleOrderFill(marketId, orderId, Number(fillPrice) / 1e18);
      });

      contract.on("OrderCancelled", async (orderId: string) => {
        await this.handleOrderCancellation(marketId, orderId);
      });

      this.eventSubscriptions.set(marketId, contract);
    } catch (error) {
      console.error(`Error subscribing to market ${marketId} events:`, error);
      throw error;
    }
  }

  async unsubscribeFromMarketEvents(marketId: string): Promise<void> {
    const contract = this.eventSubscriptions.get(marketId);
    if (contract) {
      contract.removeAllListeners();
      this.eventSubscriptions.delete(marketId);
    }
  }

  // Event handlers
  private async handlePriceUpdate(
    marketId: string,
    price: number,
    timestamp: string
  ): Promise<void> {
    try {
      // Update market price
      await marketService.updateMarketPrice(marketId, price, timestamp);

      // Publish update to subscribers
      await publishMarketPriceUpdate(marketId, { price, timestamp });
    } catch (error) {
      console.error("Error handling price update:", error);
    }
  }

  private async handlePositionOpen(position: Position): Promise<void> {
    try {
      // Update position cache
      await marketService.updatePosition(position);

      // Track analytics
      await analyticsService.trackUserTrade(
        position.trader,
        position.amount,
        0 // Initial PnL
      );

      // Send notification
      await notificationService.notifyTradeExecuted(
        position.trader,
        position.marketId,
        position.amount,
        position.entryPrice,
        position.type
      );

      // Publish update to subscribers
      await publishPositionUpdate(position.trader, position);
    } catch (error) {
      console.error("Error handling position open:", error);
    }
  }

  private async handlePositionClose(
    marketId: string,
    positionId: string,
    pnl: number
  ): Promise<void> {
    try {
      const position = await contractService.getPosition(marketId, positionId);
      if (!position) return;

      position.status = PositionStatus.CLOSED;
      position.pnl = pnl;
      position.closedAt = new Date().toISOString();

      // Update position cache
      await marketService.updatePosition(position);

      // Track analytics
      await analyticsService.trackUserTrade(
        position.trader,
        position.amount,
        pnl
      );

      // Send notification
      await notificationService.notifyPositionClosed(
        position.trader,
        position.marketId,
        pnl
      );

      // Publish update to subscribers
      await publishPositionUpdate(position.trader, position);
    } catch (error) {
      console.error("Error handling position close:", error);
    }
  }

  private async handlePositionLiquidation(
    marketId: string,
    positionId: string
  ): Promise<void> {
    try {
      const position = await contractService.getPosition(marketId, positionId);
      if (!position) return;

      position.status = PositionStatus.LIQUIDATED;
      position.closedAt = new Date().toISOString();

      // Update position cache
      await marketService.updatePosition(position);

      // Send notification
      await notificationService.notifyPositionLiquidated(
        position.trader,
        position.marketId,
        position.amount
      );

      // Publish update to subscribers
      await publishPositionUpdate(position.trader, position);
    } catch (error) {
      console.error("Error handling position liquidation:", error);
    }
  }

  private async handleOrderCreation(order: Order): Promise<void> {
    try {
      // Update order cache
      await marketService.updateOrder(order);

      // Publish update to subscribers
      await publishOrderUpdate(order.trader, order);
    } catch (error) {
      console.error("Error handling order creation:", error);
    }
  }

  private async handleOrderFill(
    marketId: string,
    orderId: string,
    fillPrice: number
  ): Promise<void> {
    try {
      const orders = await marketService.getMarketOrders(marketId);
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      order.status = OrderStatus.FILLED;
      order.price = fillPrice;
      order.updatedAt = new Date().toISOString();

      // Update order cache
      await marketService.updateOrder(order);

      // Publish update to subscribers
      await publishOrderUpdate(order.trader, order);
    } catch (error) {
      console.error("Error handling order fill:", error);
    }
  }

  private async handleOrderCancellation(
    marketId: string,
    orderId: string
  ): Promise<void> {
    try {
      const orders = await marketService.getMarketOrders(marketId);
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      order.status = OrderStatus.CANCELLED;
      order.updatedAt = new Date().toISOString();

      // Update order cache
      await marketService.updateOrder(order);

      // Publish update to subscribers
      await publishOrderUpdate(order.trader, order);
    } catch (error) {
      console.error("Error handling order cancellation:", error);
    }
  }

  private async getMarketContract(marketId: string): Promise<ethers.Contract> {
    // Implement contract instantiation logic
    throw new Error("Not implemented");
  }
}

export const marketEventHandler = new MarketEventHandler();
