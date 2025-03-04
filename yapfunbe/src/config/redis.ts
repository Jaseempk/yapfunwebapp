import Redis from "ioredis";

// Redis key prefixes
export const REDIS_KEYS = {
  CURRENT_CYCLE: "market:cycle:current",
  CYCLE_DATA: "market:cycle:data:", // Append cycleId
  ACTIVE_KOLS: "market:cycle:kols:active:", // Append cycleId
  CRASHED_KOLS: "market:cycle:kols:crashed:", // Append cycleId
  MARKET_POSITIONS: "market:positions:", // Append marketAddress
  CYCLE_STATUS: "market:cycle:status:", // Append cycleId
};

// Redis TTL values (in seconds)
export const REDIS_TTL = {
  CYCLE_DATA: 4 * 24 * 60 * 60, // 4 days (cycle duration + 1 day buffer)
  MARKET_POSITIONS: 4 * 24 * 60 * 60,
};

// Redis client configuration
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

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
