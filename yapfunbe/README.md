# YapFun Backend

Backend service for the YapFun Web3 platform, providing GraphQL API with real-time updates through WebSocket subscriptions.

## Architecture

The backend is built with a layered architecture:

1. **GraphQL Layer** (`src/graphql/`)

   - Schema definitions for markets and positions
   - Resolvers handling data fetching and real-time updates
   - WebSocket subscriptions for live data

2. **Services Layer** (`src/services/`)

   - Contract Service: Handles direct blockchain interactions using viem
   - Subgraph Service: Manages data fetching from The Graph for efficient queries

3. **Types Layer** (`src/types/`)
   - Shared TypeScript interfaces and enums
   - Type definitions for GraphQL resolvers and context

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables in `.env`:

   ```env
   PORT=4000
   REDIS_HOST=localhost
   REDIS_PORT=6379
   GRAPH_API_URL=https://api.thegraph.com/subgraphs/name/your-subgraph
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

- GraphQL API: `http://localhost:4000/graphql`
- WebSocket: `ws://localhost:4000/graphql`

## GraphQL Operations

### Queries

1. Get all markets:

   ```graphql
   query GetMarkets {
     markets {
       id
       name
       description
       totalVolume
       totalPositions
       currentPrice
       priceHistory {
         price
         timestamp
       }
     }
   }
   ```

2. Get specific market:

   ```graphql
   query GetMarket($id: ID!) {
     market(id: $id) {
       id
       name
       currentPrice
       totalPositions
     }
   }
   ```

3. Get trader positions:
   ```graphql
   query GetPositions($trader: String!) {
     positions(trader: $trader) {
       id
       marketId
       amount
       entryPrice
       type
       status
       pnl
     }
   }
   ```

### Subscriptions

1. Subscribe to market price updates:

   ```graphql
   subscription OnMarketPriceUpdated($marketId: ID!) {
     marketPriceUpdated(marketId: $marketId) {
       price
       timestamp
     }
   }
   ```

2. Subscribe to position updates:
   ```graphql
   subscription OnPositionUpdated($trader: String!) {
     positionUpdated(trader: $trader) {
       id
       marketId
       amount
       entryPrice
       pnl
       status
     }
   }
   ```

## Data Flow

1. Real-time market data:

   - Contract events are watched using viem
   - Updates are published through WebSocket subscriptions
   - Cached in Redis for quick access

2. Historical and aggregated data:
   - Fetched from The Graph subgraph
   - Provides efficient querying for time-series data
   - Used for analytics and position history

## Development

- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`

## Dependencies

- Apollo Server: GraphQL server
- Viem: Ethereum interactions
- Redis: Caching layer
- The Graph: Data indexing
