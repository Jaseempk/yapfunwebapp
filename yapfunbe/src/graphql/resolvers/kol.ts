import { MarketResolverContext } from "../../types/market";
import {
  KOL,
  KaitoKOL,
  KOLAPIResponse,
  KOLQueryResponse,
  KOLQueryArgs,
  Duration,
  DurationMap,
} from "../../types/kol";
import { kolService } from "../../services/kol";
import { errorHandler } from "../../services/error";
import { rateLimiter } from "../../services/rateLimit";
import { CACHE_TTL } from "../../config/cache";

// Resolver types
type ResolverFn<TArgs = any, TResult = any> = (
  parent: unknown,
  args: TArgs,
  context: MarketResolverContext
) => Promise<TResult>;

// Middleware types
type Middleware<TArgs = any, TResult = any> = (
  next: ResolverFn<TArgs, TResult>
) => ResolverFn<TArgs, TResult>;

// Middleware composition helper
const composeMiddleware =
  <TArgs, TResult>(middlewares: Middleware<TArgs, TResult>[]) =>
  (resolver: ResolverFn<TArgs, TResult>): ResolverFn<TArgs, TResult> => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      resolver
    );
  };

// Rate limiting middleware
const withRateLimit =
  (type: string): Middleware =>
  (next) =>
  async (parent, args, context) => {
    const identifier = context.user?.id || context.user?.address || "anonymous";
    await rateLimiter.checkLimit(identifier, type);
    return next(parent, args, context);
  };

// Cache middleware
const withCache =
  (key: string, ttl: number = CACHE_TTL.KOL): Middleware =>
  (next) =>
  async (parent, args, context) => {
    const cacheKey = `${key}:${JSON.stringify(args)}`;
    const cached = await context.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await next(parent, args, context);
    await context.redis.setex(cacheKey, ttl, JSON.stringify(result));
    return result;
  };

// Helper function to parse numeric strings safely
const safeParseNumber = (
  value: string | undefined,
  defaultValue = 0
): number => {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Helper function to parse integer strings safely
const safeParseInt = (value: string | undefined, defaultValue = 0): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Transform Kaito API response to GraphQL schema format
const transformKOLData = (data: KaitoKOL): KOL => ({
  // Map Kaito fields to KOL interface
  address: data.user_id, // Using user_id as address for contract interaction
  mindshare: data.last_7_sum_mention_percentage,
  rank: parseInt(data.rank),
  // Hardcoded trade data as requested (to be replaced with real data later)
  volume: 1000000, // Example: $1M volume
  trades: 150, // Example: 150 trades
  pnl: 25000, // Example: $25K PnL
  followers: data.follower_count,
  following: data.following_count,
  // Extended fields from Kaito
  user_id: data.user_id,
  name: data.name,
  username: data.username,
  icon: data.icon,
  bio: data.bio,
  twitter_url: data.twitter_user_url,
});

export const kolResolvers = {
  Query: {
    topKOLs: composeMiddleware([withRateLimit("query"), withCache("topKOLs")])(
      async (
        _: unknown,
        {
          duration = Duration.SEVEN_DAYS,
          topicId = "",
          topN = 100,
        }: KOLQueryArgs,
        context: MarketResolverContext
      ): Promise<KOLQueryResponse> => {
        try {
          // Input validation
          if (topN < 1 || topN > 1000) {
            throw errorHandler.badRequest("topN must be between 1 and 1000");
          }

          // Convert Duration enum to API duration string
          const apiDuration = DurationMap[duration];
          if (!apiDuration) {
            throw errorHandler.badRequest(
              `Invalid duration. Must be one of: ${Object.values(Duration).join(
                ", "
              )}`
            );
          }

          const response = await kolService.getTopKOLsWithCache(
            apiDuration,
            topicId,
            topN
          );

          return {
            kols: response.data.data.map(transformKOLData),
            latency: response.latency,
          };
        } catch (error) {
          console.error("Error in topKOLs resolver:", error);
          throw errorHandler.handle(error);
        }
      }
    ),
  },
};
