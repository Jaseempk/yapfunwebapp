export const kolTypeDefs = `#graphql
  """
  Key Opinion Leader (KOL) information including performance metrics and social stats
  """
  type KOL {
    "Ethereum address of the KOL"
    address: String!
    
    "Mindshare score indicating influence (0-100)"
    mindshare: Float!
    
    "Current ranking position"
    rank: Int!
    
    "Total trading volume in USD"
    volume: Float!
    
    "Total number of trades executed"
    trades: Int!
    
    "Total profit/loss in USD"
    pnl: Float!
    
    "Number of users following this KOL"
    followers: Int!
    
    "Number of users this KOL is following"
    following: Int!
  }

  """
  Response wrapper for KOL queries including latency metrics
  """
  type KOLResponse {
    "List of KOLs matching the query criteria"
    kols: [KOL!]!
    
    "API response latency in milliseconds"
    latency: Float
  }

  """
  Time duration options for KOL metrics
  """
  enum Duration {
    "Last 24 hours"
    ONE_DAY
    
    "Last 7 days"
    SEVEN_DAYS
    
    "Last 30 days"
    THIRTY_DAYS
    
    "Last 90 days"
    NINETY_DAYS
    
    "Last 180 days"
    HALF_YEAR
    
    "Last 365 days"
    ONE_YEAR
    
    "All time"
    ALL_TIME
  }

  extend type Query {
    """
    Get top performing KOLs based on specified criteria
    """
    topKOLs(
      "Time period for the metrics calculation"
      duration: Duration = SEVEN_DAYS
      
      "Optional topic/category filter"
      topicId: String = ""
      
      "Number of top KOLs to return (1-1000)"
      topN: Int = 100
    ): KOLResponse!
  }
`;
