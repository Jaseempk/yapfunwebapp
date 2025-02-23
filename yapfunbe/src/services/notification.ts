import { redis } from "../config/cache";
import { CACHE_PREFIX, CACHE_TTL } from "../config/cache";
import { getWebSocketService } from "./websocket";

export enum NotificationType {
  TRADE_EXECUTED = "TRADE_EXECUTED",
  POSITION_CLOSED = "POSITION_CLOSED",
  POSITION_LIQUIDATED = "POSITION_LIQUIDATED",
  NEW_FOLLOWER = "NEW_FOLLOWER",
  PRICE_ALERT = "PRICE_ALERT",
  MARKET_UPDATE = "MARKET_UPDATE",
  SYSTEM = "SYSTEM",
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export class NotificationService {
  private readonly MAX_NOTIFICATIONS = 100; // Per user
  private readonly BATCH_SIZE = 50; // For bulk operations

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any
  ): Promise<string> {
    const now = new Date().toISOString();
    const notificationId = `${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const notification: Notification = {
      id: notificationId,
      userId,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: now,
    };

    // Store notification
    const key = `${CACHE_PREFIX.USER}${userId}:notifications`;
    await redis
      .multi()
      .zadd(key, Date.now(), JSON.stringify(notification))
      .zremrangebyrank(key, 0, -(this.MAX_NOTIFICATIONS + 1))
      .exec();

    // Send real-time notification via WebSocket
    try {
      const wsService = getWebSocketService();
      await wsService.broadcastToUser(userId, "notification", notification);
    } catch (error) {
      console.error("Failed to send WebSocket notification:", error);
    }

    return notificationId;
  }

  async getNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Notification[]> {
    const key = `${CACHE_PREFIX.USER}${userId}:notifications`;
    const notifications = await redis.zrevrange(
      key,
      offset,
      offset + limit - 1
    );

    return notifications.map((n) => JSON.parse(n));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const key = `${CACHE_PREFIX.USER}${userId}:notifications`;
    const notifications = await redis.zrevrange(key, 0, -1);

    return notifications.filter((n) => !JSON.parse(n).read).length;
  }

  async markAsRead(userId: string, notificationIds: string[]): Promise<void> {
    const key = `${CACHE_PREFIX.USER}${userId}:notifications`;

    // Process in batches to avoid large transactions
    for (let i = 0; i < notificationIds.length; i += this.BATCH_SIZE) {
      const batch = notificationIds.slice(i, i + this.BATCH_SIZE);
      const multi = redis.multi();

      // Get current notifications
      const notifications = await redis.zrange(key, 0, -1);

      // Update read status for each notification in the batch
      notifications.forEach((n) => {
        const notification = JSON.parse(n);
        if (batch.includes(notification.id)) {
          notification.read = true;
          // Remove old notification and add updated one
          multi
            .zrem(key, n)
            .zadd(
              key,
              new Date(notification.createdAt).getTime(),
              JSON.stringify(notification)
            );
        }
      });

      await multi.exec();
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    const key = `${CACHE_PREFIX.USER}${userId}:notifications`;
    const notifications = await redis.zrange(key, 0, -1);
    const multi = redis.multi();

    notifications.forEach((n) => {
      const notification = JSON.parse(n);
      notification.read = true;
      // Remove old notification and add updated one
      multi
        .zrem(key, n)
        .zadd(
          key,
          new Date(notification.createdAt).getTime(),
          JSON.stringify(notification)
        );
    });

    await multi.exec();
  }

  async deleteNotification(
    userId: string,
    notificationId: string
  ): Promise<void> {
    const key = `${CACHE_PREFIX.USER}${userId}:notifications`;
    const notifications = await redis.zrange(key, 0, -1);

    const notificationToDelete = notifications.find(
      (n) => JSON.parse(n).id === notificationId
    );

    if (notificationToDelete) {
      await redis.zrem(key, notificationToDelete);
    }
  }

  async clearNotifications(userId: string): Promise<void> {
    const key = `${CACHE_PREFIX.USER}${userId}:notifications`;
    await redis.del(key);
  }

  // Helper methods for common notifications
  async notifyTradeExecuted(
    userId: string,
    marketName: string,
    amount: number,
    price: number,
    type: "LONG" | "SHORT"
  ): Promise<void> {
    await this.createNotification(
      userId,
      NotificationType.TRADE_EXECUTED,
      "Trade Executed",
      `Your ${type} order for ${amount} ${marketName} at ${price} has been executed.`,
      { marketName, amount, price, type }
    );
  }

  async notifyPositionClosed(
    userId: string,
    marketName: string,
    pnl: number
  ): Promise<void> {
    const pnlText = pnl >= 0 ? `profit of ${pnl}` : `loss of ${Math.abs(pnl)}`;
    await this.createNotification(
      userId,
      NotificationType.POSITION_CLOSED,
      "Position Closed",
      `Your position in ${marketName} has been closed with a ${pnlText}.`,
      { marketName, pnl }
    );
  }

  async notifyPositionLiquidated(
    userId: string,
    marketName: string,
    amount: number
  ): Promise<void> {
    await this.createNotification(
      userId,
      NotificationType.POSITION_LIQUIDATED,
      "Position Liquidated",
      `Your position of ${amount} ${marketName} has been liquidated.`,
      { marketName, amount }
    );
  }

  async notifyNewFollower(
    userId: string,
    followerName: string,
    followerAddress: string
  ): Promise<void> {
    await this.createNotification(
      userId,
      NotificationType.NEW_FOLLOWER,
      "New Follower",
      `${followerName} started following you.`,
      { followerName, followerAddress }
    );
  }

  async notifyPriceAlert(
    userId: string,
    marketName: string,
    price: number,
    condition: "above" | "below"
  ): Promise<void> {
    await this.createNotification(
      userId,
      NotificationType.PRICE_ALERT,
      "Price Alert",
      `${marketName} price is now ${condition} ${price}.`,
      { marketName, price, condition }
    );
  }

  async notifyMarketUpdate(
    userId: string,
    marketName: string,
    updateType: string,
    details: string
  ): Promise<void> {
    await this.createNotification(
      userId,
      NotificationType.MARKET_UPDATE,
      "Market Update",
      `${marketName}: ${details}`,
      { marketName, updateType, details }
    );
  }

  async notifySystem(
    userId: string,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    await this.createNotification(
      userId,
      NotificationType.SYSTEM,
      title,
      message,
      data
    );
  }
}

export const notificationService = new NotificationService();
