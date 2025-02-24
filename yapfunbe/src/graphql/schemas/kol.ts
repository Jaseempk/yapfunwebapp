export const kolTypeDefs = `#graphql
  """
  Key Opinion Leader (KOL) information including performance metrics and social stats
  """
  type KOL {
    "Twitter user ID (used as unique identifier for contract interaction)"
    address: String!
    
    "Mindshare score indicating influence"
    mindshare: Float!
    
    "Current ranking position"
    rank: Int!
    
    "Total trading volume in USD (temporary hardcoded)"
    volume: Float!
    
    "Total number of trades executed (temporary hardcoded)"
    trades: Int!
    
    "Total profit/loss in USD (temporary hardcoded)"
    pnl: Float!
    
    "Number of Twitter followers"
    followers: Int!
    
    "Number of Twitter following"
    following: Int!

    "Twitter user ID"
    user_id: String!
    
    "Display name"
    name: String!
    
    "Twitter username"
    username: String!
    
    "Profile image URL"
    icon: String!
    
    "User biography"
    bio: String!
    
    "Twitter profile URL"
    twitter_url: String!
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
