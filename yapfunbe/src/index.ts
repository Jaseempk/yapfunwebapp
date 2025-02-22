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

// Load environment variables
dotenv.config();

// Define context type
type Context = {
  pubsub: PubSub;
};

// Initialize PubSub
const pubsub = new PubSub();

// Create context
const createContext = async (): Promise<Context> => ({
  pubsub,
});

// Create schema
const schema = makeExecutableSchema({
  typeDefs: [marketTypeDefs],
  resolvers: [marketResolvers],
});

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // WebSocket server
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  const serverCleanup = useServer(
    {
      schema,
      context: createContext,
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
    ],
  });

  await server.start();

  // Middleware
  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
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
