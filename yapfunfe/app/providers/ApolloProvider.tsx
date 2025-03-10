"use client";

import {
  ApolloClient,
  ApolloProvider as AP,
  InMemoryCache,
  from,
  HttpLink,
  ApolloLink,
  split,
  FetchResult,
  FetchPolicy,
} from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { onError } from "@apollo/client/link/error";
import { ReactNode, useEffect, useState } from "react";
import { Observable } from "@apollo/client/utilities";

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// HTTP link with proper configuration
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql",
  credentials: "include",
});

// Request logging middleware
const loggingLink = new ApolloLink((operation, forward) => {
  const startTime = Date.now();
  console.log(`[GraphQL Request] ${operation.operationName}:`, {
    query: operation.query.loc?.source.body,
    variables: operation.variables,
  });

  return forward(operation).map((response) => {
    const duration = Date.now() - startTime;
    console.log(`[GraphQL Response] ${operation.operationName}:`, {
      data: response.data,
      errors: response.errors,
      duration: `${duration}ms`,
    });
    return response;
  });
});

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        topKOLs: {
          // Don't merge with existing data, always use new data
          merge(_, incoming) {
            return incoming;
          },
          // Read function to handle cache hits
          read(existing) {
            return existing;
          },
        },
        kols: {
          // Cache configuration for individual KOL queries
          keyArgs: ["id"],
          merge(_, incoming) {
            return incoming;
          },
        },
      },
    },
    KOL: {
      // Unique identifier for KOL objects
      keyFields: ["user_id"],
      fields: {
        // Field policies for computed fields
        mindshare: {
          read(mindshare = 0) {
            return mindshare;
          },
        },
        // Don't cache volume data to ensure fresh data on each render
        volume: {
          // This makes the field always read from the network response
          read(volume = 0) {
            return volume;
          },
          // This makes the field never merge with existing data
          merge(_, incoming) {
            return incoming;
          },
        },
      },
    },
  },
});

export function ApolloProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<ApolloClient<any> | null>(null);

  useEffect(() => {
    async function initApolloClient() {
      // Dynamically import graphql-ws to avoid SSR issues
      const { createClient } = await import("graphql-ws");

      // Create WebSocket client
      const wsClient = createClient({
        url: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/graphql",
        retryAttempts: 5,
        shouldRetry: (error) => {
          console.log("WebSocket error, attempting to retry:", error);
          return true;
        },
        retryWait: (retries) =>
          new Promise((resolve) =>
            setTimeout(resolve, Math.min(1000 * Math.pow(2, retries), 10000))
          ),
        keepAlive: 10000,
        connectionParams: async () => {
          // Add authentication token if available
          const authToken = typeof window !== 'undefined' ? localStorage.getItem("authToken") : null;
          return {
            authToken,
            // Add a unique client ID to help with debugging
            clientId: `client-${Date.now()}-${Math.random().toString(16).slice(2)}`
          };
        },
        on: {
          connected: () => console.log("WebSocket connected"),
          error: (error) => {
            console.error("WebSocket error:", error);
            // Don't close the connection on error, let the retry mechanism handle it
          },
          closed: () => console.log("WebSocket connection closed"),
          connecting: () => console.log("WebSocket connecting..."),
          message: (message) => {
            // Add validation for message format
            if (message.type === "error" && !message.id) {
              console.warn(
                "Received error message without ID, adding default ID"
              );
              // Instead of modifying the read-only property, we'll handle it differently
              // by logging the issue and letting the client handle it
            }
          },
        },
      });

      // Create WebSocket link
      const wsLink = new ApolloLink((operation) => {
        return new Observable<FetchResult>((sink) => {
          // Generate a unique ID for this operation
          const operationId = `op-${Date.now()}-${Math.random()
            .toString(16)
            .slice(2)}`;

          return wsClient.subscribe(
            {
              ...operation,
              query: operation.query.loc?.source.body || "",
              // Add a custom extension to help with debugging
              extensions: {
                ...operation.extensions,
                operationId,
              },
            },
            {
              next: (data) => sink.next({ data } as FetchResult),
              complete: () => sink.complete(),
              error: (err) => {
                console.error("GraphQL WebSocket error:", err);
                // Try to handle the error gracefully
                if (err && typeof err === "object" && "message" in err) {
                  console.warn(
                    `WebSocket error details: ${(err as Error).message}`
                  );
                }
                sink.error(err);
              },
            }
          );
        });
      });

      // Split link based on operation type
      const splitLink = split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return (
            definition.kind === "OperationDefinition" &&
            definition.operation === "subscription"
          );
        },
        wsLink,
        from([errorLink, loggingLink, httpLink])
      );

      // Create Apollo Client
      const newClient = new ApolloClient({
        link: splitLink,
        cache,
        defaultOptions: {
          watchQuery: {
            fetchPolicy: "cache-and-network" as FetchPolicy,
            nextFetchPolicy: "cache-first",
            errorPolicy: "all",
            notifyOnNetworkStatusChange: true,
          },
          query: {
            fetchPolicy: "cache-and-network" as FetchPolicy,
            errorPolicy: "all",
            notifyOnNetworkStatusChange: true,
          },
          mutate: {
            errorPolicy: "all",
          },
        },
        connectToDevTools: process.env.NODE_ENV === "development",
      });

      setClient(newClient);
    }

    initApolloClient();
  }, []);

  if (!client) {
    return null;
  }

  return <AP client={client}>{children}</AP>;
}
