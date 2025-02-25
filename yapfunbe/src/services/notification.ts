import { PositionType } from "../types/market";

export const notificationService = {
  async notifyTradeExecuted(
    trader: string,
    marketId: string,
    amount: number,
    price: number,
    type: PositionType
  ): Promise<void> {
    // TODO: Implement actual notification logic
    console.log(
      `Trade executed: ${trader} ${type} ${amount} units at ${price} in market ${marketId}`
    );
  },

  async notifyPositionClosed(
    trader: string,
    marketId: string,
    pnl: number
  ): Promise<void> {
    // TODO: Implement actual notification logic
    console.log(
      `Position closed: ${trader} in market ${marketId} with PnL ${pnl}`
    );
  },

  async notifyPositionLiquidated(
    trader: string,
    marketId: string,
    pnl: number
  ): Promise<void> {
    // TODO: Implement actual notification logic
    console.log(
      `Position liquidated: ${trader} in market ${marketId} with PnL ${pnl}`
    );
  },

  async notifyOrderFilled(
    trader: string,
    marketId: string,
    amount: number,
    price: number
  ): Promise<void> {
    // TODO: Implement actual notification logic
    console.log(
      `Order filled: ${trader} ${amount} units at ${price} in market ${marketId}`
    );
  },

  async notifyOrderCancelled(
    trader: string,
    marketId: string,
    orderId: string
  ): Promise<void> {
    // TODO: Implement actual notification logic
    console.log(
      `Order cancelled: ${trader} order ${orderId} in market ${marketId}`
    );
  },

  async notifyPriceAlert(
    marketId: string,
    price: number,
    threshold: number,
    direction: "above" | "below"
  ): Promise<void> {
    // TODO: Implement actual notification logic
    console.log(
      `Price alert: Market ${marketId} price ${price} is ${direction} threshold ${threshold}`
    );
  },
};
