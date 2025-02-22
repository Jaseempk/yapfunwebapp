export const kolTypeDefs = `#graphql
  type KOL {
    address: String!
    mindshare: Float!
    rank: Int!
    volume: Float!
    trades: Int!
    pnl: Float!
    followers: Int!
    following: Int!
  }

  type KOLResponse {
    kols: [KOL!]!
    latency: Float
  }

  extend type Query {
    topKOLs(duration: String, topicId: String, topN: Int): KOLResponse!
  }
`;
