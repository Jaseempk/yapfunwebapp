import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPlugin } from "@apollo/server";
import express from "express";
import http from "http";
import cors from "cors";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PubSub } from "graphql-subscriptions";
import dotenv from "dotenv";

import { marketTypeDefs } from "./graphql/schemas/market";
import { marketResolvers } from "./graphql/resolvers/market";
import { kolTypeDefs } from "./graphql/schemas/kol";
import { kolResolvers } from "./graphql/resolvers/kol";
import { authService } from "./services/auth";
import { rateLimiter } from "./services/rateLimit";
import { cacheUtils, redis } from "./config/cache";
import { errorHandler } from "./services/error";
import { analyticsService } from "./services/analytics";
import { initializeWebSocket } from "./services/websocket";
import { kolOrderbookService } from "./services/market";
import {
  initializeMarketDeploymentService,
  getMarketDeploymentService,
} from "./services/market/deployment";

// Load environment variables
dotenv.config();

// Define context type
interface Context {
  pubsub: PubSub;
  token?: string;
  user?: {
    userId: string;
    address: string;
    nonce?: string;
    [key: string]: any;
  };
  ip?: string;
  redis: typeof redis;
  cache: typeof cacheUtils;
}

// Initialize services
const pubsub = new PubSub();

// Create context
const createContext = async ({
  req,
}: {
  req: express.Request;
}): Promise<Context> => {
  const token = req.headers.authorization?.split(" ")[1];
  const ip = req.ip;

  let context: Context = {
    pubsub,
    token,
    ip,
    redis,
    cache: cacheUtils,
  };

  if (token) {
    try {
      const user = await authService.verifyToken(token);
      context.user = user;
    } catch (error) {
      // Token verification failed, but we'll continue without user context
      console.error("Token verification failed:", error);
    }
  }

  return context;
};

// Create schema
const schema = makeExecutableSchema({
  typeDefs: [marketTypeDefs, kolTypeDefs],
  resolvers: [marketResolvers, kolResolvers],
});

// Custom plugin for analytics and error tracking
const analyticsPlugin: ApolloServerPlugin = {
  async requestDidStart() {
    const requestStart = Date.now();
    return {
      async willSendResponse(requestContext: any) {
        const latency = Date.now() - requestStart;
        await analyticsService.trackGraphQLMetrics({
          operation: requestContext.operationName || "unknown",
          latency,
          success: !requestContext.errors,
        });
      },
      async didEncounterErrors(ctx: any) {
        ctx.errors.forEach((error: Error) => {
          errorHandler.handleGraphQLError(error);
        });
      },
    };
  },
};

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Initialize WebSocket service
  const wsService = initializeWebSocket(httpServer);

  // CORS configuration
  const corsOptions = {
    origin: ["http://localhost:3000", "https://studio.apollographql.com"],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };

  // Health check endpoint
  app.get("/health", async (_req, res) => {
    try {
      const [redisHealth, wsHealth] = await Promise.all([
        cacheUtils.healthCheck(),
        wsService.getStatus(),
      ]);

      res.json({
        status: "healthy",
        redis: redisHealth ? "connected" : "disconnected",
        websocket: {
          status: "connected",
          ...wsHealth,
        },
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Apollo Server setup
  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              wsService.cleanup();
            },
          };
        },
      },
      analyticsPlugin,
    ],
    formatError: (error) => {
      errorHandler.handleGraphQLError(error);
      return error;
    },
  });

  await server.start();

  // Apply middleware
  app.use(express.json());

  // GraphQL endpoint with CORS
  app.use(
    "/graphql",
    cors(corsOptions),
    express.json(),
    expressMiddleware(server, {
      context: createContext,
    })
  );

  // Initialize services
  try {
    // Initialize market deployment service
    const marketDeploymentService = initializeMarketDeploymentService(
      process.env.DEPLOYER_PRIVATE_KEY!
    );
    await marketDeploymentService.setupEventListeners();
    console.log("🚀 Market deployment service initialized");

    // Initialize KOL orderbook automation
    await kolOrderbookService.initialize();
    console.log("🤖 KOL orderbook automation service initialized");

    // Initial market check and deployment
    await marketDeploymentService.checkAndDeployMarkets();
    console.log("✅ Initial market check completed");
  } catch (error) {
    console.error("Failed to initialize services:", error);
  }

  // Start server
  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(`🔌 WebSocket server ready at ws://localhost:${PORT}/graphql`);
  });

  // Error handling
  process.on("unhandledRejection", (error: Error) => {
    console.error("Unhandled promise rejection:", error);
    errorHandler.handle(error);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    try {
      await Promise.all([
        server.stop(),
        wsService.cleanup(),
        redis.quit(),
        kolOrderbookService.cleanup(),
      ]);
      console.log("Cleanup completed. Exiting...");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  errorHandler.handle(error);
  process.exit(1);
});
