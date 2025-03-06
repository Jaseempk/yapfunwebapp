import { ApolloClient, InMemoryCache } from "@apollo/client";

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || 
  "";

export const apolloClient = new ApolloClient({
  uri: SUBGRAPH_URL,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "network-only",
    },
    query: {
      fetchPolicy: "network-only",
    },
  },
});
