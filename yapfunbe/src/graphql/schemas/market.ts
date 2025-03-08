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

  type Order {
    id: ID!
    marketId: ID!
    trader: String!
    amount: Float!
    price: Float!
    type: OrderType!
    status: OrderStatus!
    createdAt: String!
    updatedAt: String!
  }

  enum OrderType {
    LIMIT
    MARKET
  }

  enum OrderStatus {
    OPEN
    FILLED
    CANCELLED
  }

  enum CycleStatusEnum {
    NOT_STARTED
    ACTIVE
    ENDING
    BUFFER
    ENDED
  }

  type CycleStatus {
    status: CycleStatusEnum!
    bufferEndTime: String
    globalExpiry: String
    isInBuffer: Boolean!
  }

  type Query {
    markets: [Market!]!
    market(id: ID!): Market
    # positions and marketPositions queries have been removed as they are not used by the frontend
    # The frontend uses useUserOrders hook directly with the subgraph
    orders(trader: String!): [Order!]!
    marketOrders(marketId: ID!): [Order!]!
    cycleStatus: CycleStatus
  }

  input CreatePositionInput {
    marketId: ID!
    amount: Float!
    leverage: Float!
    type: PositionType!
  }

  input CreateOrderInput {
    marketId: ID!
    amount: Float!
    price: Float!
    type: OrderType!
  }

  input UpdateOrderInput {
    orderId: ID!
    price: Float!
  }

  type Mutation {
    createPosition(input: CreatePositionInput!): Position!
    closePosition(positionId: ID!): Position!
    createOrder(input: CreateOrderInput!): Order!
    updateOrder(input: UpdateOrderInput!): Order!
    cancelOrder(orderId: ID!): Order!
  }

  type MarketDeployment {
    kolId: String!
    marketAddress: String!
    kolName: String!
    timestamp: String!
    mindshare: Float!
    rank: String!
  }

  type Subscription {
    marketPriceUpdated(marketId: ID!): PricePoint!
    positionUpdated(trader: String!): Position!
    orderUpdated(trader: String!): Order!
    marketDeployed: MarketDeployment!
  }
`;
