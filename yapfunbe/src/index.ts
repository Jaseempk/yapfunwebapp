import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http from "http";
import cors from "cors";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
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

// Load environment variables
dotenv.config();

// Define context type
interface Context {
  pubsub: PubSub;
  token?: string;
  user?: any;
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
      const user = authService.verifyToken(token);
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
const analyticsPlugin = {
  async requestDidStart() {
    const requestStart = Date.now();
    return {
      async willSendResponse(requestContext: any) {
        const latency = Date.now() - requestStart;
        analyticsService.trackGraphQLMetrics({
          operation: requestContext.operationName || "unknown",
          latency,
          success: !requestContext.errors,
        });
      },
      async didEncounterErrors(ctx: any) {
        ctx.errors.forEach((error: any) => {
          errorHandler.handleGraphQLError(error);
        });
      },
    };
  },
};

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Health check endpoint
  app.get("/health", async (req, res) => {
    try {
      const redisHealth = await cacheUtils.healthCheck();
      res.json({
        status: "healthy",
        redis: redisHealth ? "connected" : "disconnected",
      });
    } catch (error) {
      res.status(500).json({ status: "unhealthy", error: error.message });
    }
  });

  // WebSocket server
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx: any) => {
        // WebSocket context
        const token = ctx.connectionParams?.authorization?.split(" ")[1];
        return { pubsub, token };
      },
    },
    wsServer
  );

  // Apollo Server setup
  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
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

  // Middleware
  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
    // Rate limiting middleware
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      try {
        const identifier = req.headers.authorization?.split(" ")[1] || req.ip;
        await rateLimiter.checkLimit(identifier);
        next();
      } catch (error) {
        res.status(429).json({ error: error.message });
      }
    },
    expressMiddleware(server, {
      context: createContext,
    })
  );

  // Start server
  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(`🔌 WebSocket server ready at ws://localhost:${PORT}/graphql`);
  });

  // Error handling
  process.on("unhandledRejection", (error) => {
    console.error("Unhandled promise rejection:", error);
  });

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    await server.stop();
    process.exit(0);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
