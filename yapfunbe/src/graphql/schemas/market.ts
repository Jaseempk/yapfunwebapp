export const marketTypeDefs = `#graphql
  type Market {
    id: ID!
    name: String!
    description: String
    totalVolume: Float!
    totalPositions: Int!
    currentPrice: Float!
    priceHistory: [PricePoint!]!
    createdAt: String!
    updatedAt: String!
  }

  type PricePoint {
    price: Float!
    timestamp: String!
  }

  type Position {
    id: ID!
    marketId: ID!
    trader: String!
    amount: Float!
    entryPrice: Float!
    type: PositionType!
    status: PositionStatus!
    pnl: Float
    createdAt: String!
    closedAt: String
  }

  enum PositionType {
    LONG
    SHORT
  }

  enum PositionStatus {
    OPEN
    CLOSED
    LIQUIDATED
  }

  type Query {
    markets: [Market!]!
    market(id: ID!): Market
    positions(trader: String!): [Position!]!
    marketPositions(marketId: ID!): [Position!]!
  }

  type Subscription {
    marketPriceUpdated(marketId: ID!): PricePoint!
    positionUpdated(trader: String!): Position!
  }
`;
