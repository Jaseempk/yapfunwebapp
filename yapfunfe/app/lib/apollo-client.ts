import { ApolloClient, InMemoryCache } from '@apollo/client';

const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/58232/orderbook_factory/version/latest";

export const apolloClient = new ApolloClient({
  uri: SUBGRAPH_URL,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
    },
    query: {
      fetchPolicy: 'network-only',
    },
  },
}); 