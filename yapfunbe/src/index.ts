import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPlugin } from "@apollo/server";
import express from "express";
import http from "http";
import cors from "cors";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PubSub } from "graphql-subscriptions";
import { ethers } from "ethers";
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
import {
  kolOrderbookService,
  initializeMarketServices,
} from "./services/market";
import { kolService } from "./services/kol";
import { KOL } from "./types/kol";
import { marketEvents, MarketEventType } from "./services/market/events";
import {
  initializeMarketDeploymentService,
  getMarketDeploymentService,
} from "./services/market/deployment";
import { yapOracleAbi, yapOracleCA } from "./abi/yapOracle";

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

// Initialize Oracle contract
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const oracleContract = new ethers.Contract(yapOracleCA, yapOracleAbi, provider);

// Listen for KOLDataUpdated events
oracleContract.on(
  "KOLDataUpdated",
  async (kolId, rank, mindshareScore, timestamp) => {
    try {
      console.log(`KOL data updated for ${kolId}`);

      // Get KOL data from Kaito API
      const kols = await kolService.getKOLs();

      // Check and deploy markets for any new KOLs
      const marketDeploymentService = getMarketDeploymentService();
      const kolIds = kols.map((kol) => kol.user_id);
      await marketDeploymentService.checkAndDeployMarkets(kolIds);
    } catch (error) {
      console.error("Error handling KOLDataUpdated event:", error);
      errorHandler.handle(error);
    }
  }
);

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
    origin: [
      "http://localhost:3000",
      "https://studio.apollographql.com",
      "https://yapfun-frontend.onrender.com",
      /\.onrender\.com$/, // Allow all Render domains
    ],
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
    if (!process.env.DEPLOYER_PRIVATE_KEY || !process.env.RPC_URL) {
      throw new Error(
        "DEPLOYER_PRIVATE_KEY and RPC_URL environment variables are required"
      );
    }

    // Initialize market deployment service
    const marketDeploymentService = initializeMarketDeploymentService(
      process.env.DEPLOYER_PRIVATE_KEY
    );

    // Initialize market services (includes event listeners and KOL data handling)
    await initializeMarketServices();
    console.log("🚀 Market services initialized");

    // Initialize KOL orderbook automation
    await kolOrderbookService.initialize();
    console.log("🤖 KOL orderbook automation service initialized");

    // Get initial KOL data and deploy markets if needed
    const kols = await kolService.getKOLs();
    const kolIds = kols.map((kol: KOL) => kol.user_id);
    await marketDeploymentService.checkAndDeployMarkets(kolIds);

    // Setup event listener for market deployments
    marketDeploymentService.setupEventListeners(async (event) => {
      console.log("Market initialised:", event);
      const kolId = event.args.kolId;
      const kol = await kolService.getKOL(kolId);
      // Emit market deployment event for frontend
      marketEvents.emit(MarketEventType.MARKET_DEPLOYED, {
        kolId,
        marketAddress: event.args.marketAddy,
        kolName: kol?.name || kolId,
        timestamp: new Date().toISOString(),
        mindshare: kol?.mindshare || 0,
        rank: kol?.rank || "0",
      });
    });
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
