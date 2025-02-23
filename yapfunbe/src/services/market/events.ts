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
import { getWebSocketService } from "../websocket";
import { errorHandler } from "../error";
import { marketConfig } from "./config";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export class MarketEventHandler {
  private readonly provider: ethers.JsonRpcProvider;
  private readonly RPC_URL = process.env.RPC_URL || "http://localhost:8545";
  private eventSubscriptions: Map<string, ethers.Contract> = new Map();
  private retryAttempts: Map<string, number> = new Map();

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
      if (!contract) {
        throw new Error(`Failed to get contract for market ${marketId}`);
      }

      // Price update events
      contract.on("PriceUpdated", async (price: bigint, timestamp: bigint) => {
        const priceNumber = Number(price) / 1e18; // Assuming 18 decimals
        const timestampStr = new Date(Number(timestamp) * 1000).toISOString();

        await this.retryOperation(
          () => this.handlePriceUpdate(marketId, priceNumber, timestampStr),
          `price_update:${marketId}`
        );
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

          await this.retryOperation(
            () => this.handlePositionOpen(position),
            `position_open:${positionId}`
          );
        }
      );

      contract.on("PositionClosed", async (positionId: string, pnl: bigint) => {
        await this.retryOperation(
          () =>
            this.handlePositionClose(marketId, positionId, Number(pnl) / 1e18),
          `position_close:${positionId}`
        );
      });

      contract.on("PositionLiquidated", async (positionId: string) => {
        await this.retryOperation(
          () => this.handlePositionLiquidation(marketId, positionId),
          `position_liquidate:${positionId}`
        );
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

          await this.retryOperation(
            () => this.handleOrderCreation(order),
            `order_create:${orderId}`
          );
        }
      );

      contract.on("OrderFilled", async (orderId: string, fillPrice: bigint) => {
        await this.retryOperation(
          () =>
            this.handleOrderFill(marketId, orderId, Number(fillPrice) / 1e18),
          `order_fill:${orderId}`
        );
      });

      contract.on("OrderCancelled", async (orderId: string) => {
        await this.retryOperation(
          () => this.handleOrderCancellation(marketId, orderId),
          `order_cancel:${orderId}`
        );
      });

      // Error handling
      contract.on("error", (error: Error) => {
        console.error(`Contract error for market ${marketId}:`, error);
        this.handleEventError(marketId, error);
      });

      this.eventSubscriptions.set(marketId, contract);
    } catch (error) {
      console.error(`Error subscribing to market ${marketId} events:`, error);
      throw errorHandler.handle(error);
    }
  }

  async unsubscribeFromMarketEvents(marketId: string): Promise<void> {
    try {
      const contract = this.eventSubscriptions.get(marketId);
      if (contract) {
        contract.removeAllListeners();
        this.eventSubscriptions.delete(marketId);
        this.retryAttempts.delete(marketId);
      }
    } catch (error) {
      console.error(
        `Error unsubscribing from market ${marketId} events:`,
        error
      );
      throw errorHandler.handle(error);
    }
  }

  // Event handlers
  private async handlePriceUpdate(
    marketId: string,
    price: number,
    timestamp: string
  ): Promise<void> {
    try {
      const wsService = getWebSocketService();

      // Update market price
      await marketService.updateMarketPrice(marketId, price, timestamp);

      // Broadcast to WebSocket clients
      await wsService.broadcast(`market:${marketId}:price`, {
        price,
        timestamp,
      });
    } catch (error) {
      console.error("Error handling price update:", error);
      throw error; // Let retry mechanism handle it
    }
  }

  private async handlePositionOpen(position: Position): Promise<void> {
    try {
      const wsService = getWebSocketService();

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

      // Broadcast to WebSocket clients
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
      console.error("Error handling position open:", error);
      throw error;
    }
  }

  private async handlePositionClose(
    marketId: string,
    positionId: string,
    pnl: number
  ): Promise<void> {
    try {
      const wsService = getWebSocketService();
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

      // Broadcast to WebSocket clients
      await wsService.broadcast(`market:${marketId}:position`, position);
      await wsService.broadcastToUser(
        position.trader,
        "position_update",
        position
      );
    } catch (error) {
      console.error("Error handling position close:", error);
      throw error;
    }
  }

  private async handlePositionLiquidation(
    marketId: string,
    positionId: string
  ): Promise<void> {
    try {
      const wsService = getWebSocketService();
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

      // Broadcast to WebSocket clients
      await wsService.broadcast(`market:${marketId}:position`, position);
      await wsService.broadcastToUser(
        position.trader,
        "position_update",
        position
      );
    } catch (error) {
      console.error("Error handling position liquidation:", error);
      throw error;
    }
  }

  private async handleOrderCreation(order: Order): Promise<void> {
    try {
      const wsService = getWebSocketService();

      // Update order cache
      await marketService.updateOrder(order);

      // Broadcast to WebSocket clients
      await wsService.broadcast(`market:${order.marketId}:order`, order);
      await wsService.broadcastToUser(order.trader, "order_update", order);
    } catch (error) {
      console.error("Error handling order creation:", error);
      throw error;
    }
  }

  private async handleOrderFill(
    marketId: string,
    orderId: string,
    fillPrice: number
  ): Promise<void> {
    try {
      const wsService = getWebSocketService();
      const orders = await marketService.getMarketOrders(marketId);
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      order.status = OrderStatus.FILLED;
      order.price = fillPrice;
      order.updatedAt = new Date().toISOString();

      // Update order cache
      await marketService.updateOrder(order);

      // Broadcast to WebSocket clients
      await wsService.broadcast(`market:${marketId}:order`, order);
      await wsService.broadcastToUser(order.trader, "order_update", order);
    } catch (error) {
      console.error("Error handling order fill:", error);
      throw error;
    }
  }

  private async handleOrderCancellation(
    marketId: string,
    orderId: string
  ): Promise<void> {
    try {
      const wsService = getWebSocketService();
      const orders = await marketService.getMarketOrders(marketId);
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      order.status = OrderStatus.CANCELLED;
      order.updatedAt = new Date().toISOString();

      // Update order cache
      await marketService.updateOrder(order);

      // Broadcast to WebSocket clients
      await wsService.broadcast(`market:${marketId}:order`, order);
      await wsService.broadcastToUser(order.trader, "order_update", order);
    } catch (error) {
      console.error("Error handling order cancellation:", error);
      throw error;
    }
  }

  private async getMarketContract(marketId: string): Promise<ethers.Contract> {
    try {
      const address = marketConfig.getMarketAddress(marketId);
      if (!address) {
        throw new Error(`No contract address found for market ${marketId}`);
      }

      const abi = marketConfig.getMarketABI();
      return new ethers.Contract(address, abi, this.provider);
    } catch (error) {
      console.error(`Error getting market contract ${marketId}:`, error);
      throw errorHandler.handle(error);
    }
  }

  private async retryOperation(
    operation: () => Promise<void>,
    operationId: string
  ): Promise<void> {
    let attempts = this.retryAttempts.get(operationId) || 0;

    try {
      await operation();
      // Reset attempts on success
      this.retryAttempts.delete(operationId);
    } catch (error) {
      attempts++;
      this.retryAttempts.set(operationId, attempts);

      if (attempts < MAX_RETRIES) {
        console.warn(
          `Retrying operation ${operationId} (attempt ${attempts}/${MAX_RETRIES})`
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        await this.retryOperation(operation, operationId);
      } else {
        console.error(
          `Operation ${operationId} failed after ${MAX_RETRIES} attempts:`,
          error
        );
        this.retryAttempts.delete(operationId);
        throw error;
      }
    }
  }

  private handleEventError(marketId: string, error: Error): void {
    console.error(`Event error for market ${marketId}:`, error);
    // Attempt to resubscribe
    this.unsubscribeFromMarketEvents(marketId)
      .then(() => this.subscribeToMarketEvents(marketId))
      .catch((e) =>
        console.error(`Failed to resubscribe to market ${marketId}:`, e)
      );
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      // Check provider connection
      await this.provider.getNetwork();

      // Check subscriptions
      for (const [marketId, contract] of this.eventSubscriptions) {
        if (!contract.listenerCount()) {
          console.warn(`No listeners for market ${marketId}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Market event handler health check failed:", error);
      return false;
    }
  }
}

export const marketEventHandler = new MarketEventHandler();
