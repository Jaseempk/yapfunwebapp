import { WebSocketServer } from "ws";
import { Server } from "http";
import { verify } from "jsonwebtoken";
import { redis } from "../config/cache";
import { errorHandler } from "./error";
import { rateLimiter } from "./rateLimit";

interface WebSocketMessage {
  type: string;
  payload: any;
}

interface SubscriptionMap {
  [key: string]: Set<WebSocket>;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private subscriptions: SubscriptionMap = {};
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  private setupWebSocketServer() {
    this.wss.on(
      "connection",
      async (ws: WebSocket & { isAlive?: boolean; userId?: string }) => {
        ws.isAlive = true;

        ws.on("pong", () => {
          ws.isAlive = true;
        });

        ws.on("message", async (data: string) => {
          try {
            const message: WebSocketMessage = JSON.parse(data);
            await this.handleMessage(ws, message);
          } catch (error) {
            this.sendError(ws, "Invalid message format");
          }
        });

        ws.on("close", () => {
          this.handleDisconnect(ws);
        });
      }
    );
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: WebSocket & { isAlive?: boolean }) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  private async handleMessage(
    ws: WebSocket & { userId?: string },
    message: WebSocketMessage
  ) {
    try {
      switch (message.type) {
        case "authenticate":
          await this.handleAuthentication(ws, message.payload.token);
          break;

        case "subscribe":
          await this.handleSubscription(ws, message.payload);
          break;

        case "unsubscribe":
          await this.handleUnsubscription(ws, message.payload);
          break;

        default:
          this.sendError(ws, "Unknown message type");
      }
    } catch (error) {
      this.sendError(
        ws,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  private async handleAuthentication(
    ws: WebSocket & { userId?: string },
    token: string
  ) {
    try {
      const decoded = verify(token, this.JWT_SECRET) as { userId: string };
      ws.userId = decoded.userId;
      this.sendSuccess(ws, "authenticated", { userId: decoded.userId });
    } catch (error) {
      throw errorHandler.unauthorized("Invalid authentication token");
    }
  }

  private async handleSubscription(
    ws: WebSocket & { userId?: string },
    payload: { channel: string }
  ) {
    const { channel } = payload;

    // Rate limit check
    if (ws.userId) {
      await rateLimiter.checkLimit(ws.userId, "websocket");
    }

    if (!this.subscriptions[channel]) {
      this.subscriptions[channel] = new Set();
    }
    this.subscriptions[channel].add(ws);

    // Store subscription in Redis for recovery
    if (ws.userId) {
      await redis.sadd(`ws:user:${ws.userId}:subscriptions`, channel);
    }

    this.sendSuccess(ws, "subscribed", { channel });
  }

  private async handleUnsubscription(
    ws: WebSocket & { userId?: string },
    payload: { channel: string }
  ) {
    const { channel } = payload;

    if (this.subscriptions[channel]) {
      this.subscriptions[channel].delete(ws);
      if (this.subscriptions[channel].size === 0) {
        delete this.subscriptions[channel];
      }
    }

    // Remove subscription from Redis
    if (ws.userId) {
      await redis.srem(`ws:user:${ws.userId}:subscriptions`, channel);
    }

    this.sendSuccess(ws, "unsubscribed", { channel });
  }

  private handleDisconnect(ws: WebSocket) {
    // Remove from all subscriptions
    Object.values(this.subscriptions).forEach((subscribers) => {
      subscribers.delete(ws);
    });

    // Clean up empty subscription sets
    Object.entries(this.subscriptions).forEach(([channel, subscribers]) => {
      if (subscribers.size === 0) {
        delete this.subscriptions[channel];
      }
    });
  }

  // Public methods for broadcasting updates
  public async broadcast(channel: string, data: any) {
    const subscribers = this.subscriptions[channel];
    if (!subscribers) return;

    const message = JSON.stringify({
      type: "update",
      channel,
      data,
      timestamp: new Date().toISOString(),
    });

    subscribers.forEach((client: WebSocket & { isAlive?: boolean }) => {
      if (client.isAlive) {
        client.send(message);
      }
    });
  }

  public async broadcastToUser(userId: string, type: string, data: any) {
    this.wss.clients.forEach((client: WebSocket & { userId?: string }) => {
      if (client.userId === userId) {
        client.send(
          JSON.stringify({
            type,
            data,
            timestamp: new Date().toISOString(),
          })
        );
      }
    });
  }

  private sendSuccess(ws: WebSocket, type: string, data: any) {
    ws.send(
      JSON.stringify({
        type,
        status: "success",
        data,
        timestamp: new Date().toISOString(),
      })
    );
  }

  private sendError(ws: WebSocket, message: string) {
    ws.send(
      JSON.stringify({
        type: "error",
        status: "error",
        message,
        timestamp: new Date().toISOString(),
      })
    );
  }

  // Cleanup
  public cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss.close();
  }

  // Health check
  public getStatus() {
    return {
      clientCount: this.wss.clients.size,
      channelCount: Object.keys(this.subscriptions).length,
      subscriptionCount: Object.values(this.subscriptions).reduce(
        (acc, subscribers) => acc + subscribers.size,
        0
      ),
    };
  }
}

let wsService: WebSocketService | null = null;

export const initializeWebSocket = (server: Server) => {
  if (!wsService) {
    wsService = new WebSocketService(server);
  }
  return wsService;
};

export const getWebSocketService = () => {
  if (!wsService) {
    throw new Error("WebSocket service not initialized");
  }
  return wsService;
};
