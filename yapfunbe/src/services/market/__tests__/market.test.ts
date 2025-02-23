import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { redis } from "../../../config/cache";
import { marketService } from "../market";
import { MarketEventHandler } from "../events";
import { marketConfigService } from "../config";
import { contractService } from "../../contract";
import { subgraphService } from "../../subgraph";
import {
  Market,
  Position,
  Order,
  PositionType,
  OrderType,
  PositionStatus,
} from "../../../types/market";
import { Redis } from "ioredis";

// Mock Redis methods with correct types
const mockRedis = {
  get: jest.fn().mockImplementation(() => Promise.resolve(null)),
  set: jest.fn().mockImplementation(() => Promise.resolve("OK")),
  setex: jest.fn().mockImplementation(() => Promise.resolve("OK")),
  del: jest.fn().mockImplementation(() => Promise.resolve(1)),
  hget: jest.fn().mockImplementation(() => Promise.resolve(null)),
  hset: jest.fn().mockImplementation(() => Promise.resolve(1)),
  hdel: jest.fn().mockImplementation(() => Promise.resolve(1)),
  hgetall: jest.fn().mockImplementation(() => Promise.resolve({})),
  keys: jest.fn().mockImplementation(() => Promise.resolve([])),
  multi: jest.fn(() => ({
    exec: jest.fn().mockImplementation(() => Promise.resolve([])),
  })),
} as unknown as Redis;

// Mock dependencies
jest.mock("../../../config/cache", () => ({
  redis: mockRedis,
  CACHE_PREFIX: {
    MARKET: "market:",
  },
  CACHE_TTL: {
    MARKET: 60,
  },
}));

jest.mock("../../contract");
jest.mock("../../subgraph");

describe("Market Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMarket", () => {
    it("should return cached market if available", async () => {
      const mockMarket: Market = {
        id: "1",
        name: "Test Market",
        totalVolume: 1000,
        totalPositions: 10,
        currentPrice: 100,
        priceHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockMarket));

      const result = await marketService.getMarket("1");
      expect(result).toEqual(mockMarket);
      expect(redis.get).toHaveBeenCalledWith("market:1");
    });

    it("should fetch from contract if not cached", async () => {
      const mockMarket: Market = {
        id: "1",
        name: "Test Market",
        totalVolume: 1000,
        totalPositions: 10,
        currentPrice: 100,
        priceHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRedis.get.mockResolvedValueOnce(null);
      (contractService.getMarketData as jest.Mock).mockResolvedValueOnce(
        mockMarket
      );

      const result = await marketService.getMarket("1");
      expect(result).toEqual(mockMarket);
      expect(contractService.getMarketData).toHaveBeenCalledWith("1");
    });
  });

  describe("getMarketPositions", () => {
    it("should return cached positions if available", async () => {
      const mockPositions: Position[] = [
        {
          id: "1",
          marketId: "1",
          trader: "0x123",
          amount: 100,
          entryPrice: 50,
          type: PositionType.LONG,
          status: PositionStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
      ];

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockPositions));

      const result = await marketService.getMarketPositions("1");
      expect(result).toEqual(mockPositions);
    });

    it("should fetch from subgraph if not cached", async () => {
      const mockPositions: Position[] = [
        {
          id: "1",
          marketId: "1",
          trader: "0x123",
          amount: 100,
          entryPrice: 50,
          type: PositionType.LONG,
          status: "OPEN",
          createdAt: new Date().toISOString(),
        },
      ];

      mockRedis.get.mockResolvedValueOnce(null);
      (subgraphService.getMarketPositions as jest.Mock).mockResolvedValueOnce(
        mockPositions
      );

      const result = await marketService.getMarketPositions("1");
      expect(result).toEqual(mockPositions);
    });
  });

  describe("Market Config Service", () => {
    it("should validate market configuration", async () => {
      const mockConfig = {
        address: "0x123",
        name: "Test Market",
        minAmount: 10,
        maxAmount: 1000,
        minLeverage: 1,
        maxLeverage: 10,
        liquidationThreshold: 0.8,
        tradingFee: 0.001,
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockConfig));

      const result = await marketConfigService.validateMarketConfig("1");
      expect(result).toBe(true);
    });

    it("should validate trade amount", async () => {
      const mockConfig = {
        minAmount: 10,
        maxAmount: 1000,
      };

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockConfig));

      const result = await marketConfigService.validateTradeAmount("1", 100);
      expect(result).toBe(true);
    });
  });

  describe("Market Event Handler", () => {
    it("should handle price updates", async () => {
      const mockPrice = 100;
      const mockTimestamp = new Date().toISOString();

      const handler = new MarketEventHandler();
      await (handler as any).handlePriceUpdate("1", mockPrice, mockTimestamp);

      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it("should handle position updates", async () => {
      const mockPosition: Position = {
        id: "1",
        marketId: "1",
        trader: "0x123",
        amount: 100,
        entryPrice: 50,
        type: PositionType.LONG,
        status: "OPEN",
        createdAt: new Date().toISOString(),
      };

      const handler = new MarketEventHandler();
      await (handler as any).handlePositionOpen(mockPosition);

      expect(mockRedis.setex).toHaveBeenCalled();
    });
  });
});
