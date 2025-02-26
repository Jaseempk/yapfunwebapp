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
          // Merge function for pagination
          merge(existing = { kols: [] }, incoming) {
            return {
              ...incoming,
              kols: [...(existing.kols || []), ...(incoming.kols || [])],
            };
          },
          // Read function to handle cache hits
          read(existing) {
            return existing;
          },
        },
        kols: {
          // Cache configuration for individual KOL queries
          keyArgs: ["id"],
          merge(existing = [], incoming) {
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
        volume: {
          read(volume = 0) {
            return volume;
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
        connectionParams: {
          // Add any connection parameters if needed
        },
      });

      // Create WebSocket link
      const wsLink = new ApolloLink((operation) => {
        return new Observable<FetchResult>((sink) => {
          return wsClient.subscribe(
            {
              ...operation,
              query: operation.query.loc?.source.body || "",
            },
            {
              next: (data) => sink.next({ data } as FetchResult),
              complete: () => sink.complete(),
              error: (err) => sink.error(err),
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
            fetchPolicy: "cache-and-network",
            nextFetchPolicy: "cache-first",
            notifyOnNetworkStatusChange: true,
          },
          query: {
            fetchPolicy: "cache-first",
            errorPolicy: "all",
            notifyOnNetworkStatusChange: true,
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
