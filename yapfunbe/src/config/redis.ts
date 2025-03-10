import Redis from "ioredis";

// Redis key prefixes
export const REDIS_KEYS = {
  CURRENT_CYCLE: "market:cycle:current",
  CYCLE_DATA: "market:cycle:data:", // Append cycleId
  ACTIVE_KOLS: "market:cycle:kols:active:", // Append cycleId
  CRASHED_KOLS: "market:cycle:kols:crashed:", // Append cycleId
  MARKET_POSITIONS: "market:positions:", // Append marketAddress
  CYCLE_STATUS: "market:cycle:status:", // Append cycleId
  MARKET_DATA: "market:data:", // Append marketAddress
  MARKET_MINDSHARES: "market:mindshares:", // Append marketAddress
  GLOBAL_EXPIRY: "market:cycle:expiry:", // Append cycleId
  BUFFER_END: "market:cycle:buffer:", // Append cycleId
  DEPLOYMENT_LOCK: 'deployment:lock',
  DEPLOYMENT_STATUS: 'deployment:status'
};

// Redis TTL values (in seconds)
export const REDIS_TTL = {
  CYCLE_DATA: 3 * 24 * 60 * 60, // 5 days (cycle duration + buffer + extra day)
  MARKET_POSITIONS: 3 * 24 * 60 * 60,
  MARKET_DATA: 3 * 24 * 60 * 60,
  MINDSHARE_DATA: 3 * 24 * 60 * 60,
};

// Redis client configuration
let redisConfig: any;

if (process.env.REDIS_URL) {
  // Use Render's Redis URL format
  redisConfig = {
    url: process.env.REDIS_URL,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  };
} else {
  // Use traditional configuration for local development
  redisConfig = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  };
}

// Create Redis client instance
export const redisClient = new Redis(redisConfig);

// Handle Redis connection events
redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

redisClient.on("error", (error) => {
  console.error("Redis connection error:", error);
});

export default redisClient;
