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
  DEPLOYMENT_LOCK: "deployment:lock",
  DEPLOYMENT_STATUS: "deployment:status",
};

// Redis TTL values (in seconds)
export const REDIS_TTL = {
  CYCLE_DATA: 3 * 24 * 60 * 60, // 5 days (cycle duration + buffer + extra day)
  MARKET_POSITIONS: 3 * 24 * 60 * 60,
  MARKET_DATA: 3 * 24 * 60 * 60,
  MINDSHARE_DATA: 3 * 24 * 60 * 60,
};

// Debug: Log environment variables
console.log("Redis Environment Variables:");
console.log("REDIS_URL:", process.env.REDIS_URL);

// Redis client configuration
const redisConfig = {
  url: process.env.REDIS_URL,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    console.log(`Redis retry attempt ${times}, delay: ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  reconnectOnError: (err: Error) => {
    console.log("Redis reconnect error:", err.message);
    return true;
  },
  lazyConnect: true // Don't connect immediately
};

console.log("Redis Configuration:", {
  ...redisConfig,
  url: redisConfig.url ? "[HIDDEN]" : undefined
});

// Create Redis client instance
export const redisClient = new Redis(redisConfig);

// Handle Redis connection events
redisClient.on("connect", () => {
  console.log("Redis connecting...");
});

redisClient.on("ready", () => {
  console.log("Redis connection established and ready");
});

redisClient.on("error", (error) => {
  console.error("Redis connection error:", error);
});

redisClient.on("close", () => {
  console.log("Redis connection closed");
});

redisClient.on("reconnecting", () => {
  console.log("Redis reconnecting...");
  console.log("Current REDIS_URL:", process.env.REDIS_URL);
});

redisClient.on("end", () => {
  console.log("Redis connection ended");
});

// Explicitly connect
redisClient.connect().catch((err) => {
  console.error("Initial Redis connection failed:", err);
});

export default redisClient;
