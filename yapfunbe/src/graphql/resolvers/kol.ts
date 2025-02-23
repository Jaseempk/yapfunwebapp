import { MarketResolverContext } from "../../types/market";
import {
  KOL,
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

// Transform KOL API response to GraphQL schema format
const transformKOLData = (data: KOLAPIResponse["data"]["data"][0]): KOL => ({
  address: data.address,
  mindshare: safeParseNumber(data.mindshare),
  rank: safeParseInt(data.rank),
  volume: safeParseNumber(data.volume),
  trades: safeParseInt(data.trades),
  pnl: safeParseNumber(data.pnl),
  followers: safeParseInt(data.followers),
  following: safeParseInt(data.following),
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
