import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { redis } from "../../../config/cache";
import { marketService } from "../market";
import { MarketEventHandler } from "../events";
import { marketConfig } from "../config";
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
import { ethers } from "ethers";

// Mock Redis
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  hget: jest.fn(),
  hset: jest.fn(),
  hdel: jest.fn(),
  hgetall: jest.fn(),
  keys: jest.fn(),
  multi: jest.fn(() => ({
    exec: jest.fn().mockResolvedValue([["OK"]]),
  })),
  pipeline: jest.fn(() => ({
    exec: jest.fn().mockResolvedValue([["OK"]]),
  })),
} as jest.Mocked<Pick<Redis, keyof typeof mockRedis>>;

jest.mock("../../../config/cache", () => ({
  redis: mockRedis,
  CACHE_PREFIX: {
    MARKET: "market:",
  },
  CACHE_TTL: {
    MARKET: 60,
  },
}));

jest.mock("../../contract", () => ({
  contractService: {
    getMarketData: jest.fn(),
    getPosition: jest.fn(),
  },
}));

jest.mock("../../subgraph", () => ({
  subgraphService: {
    getMarketPositions: jest.fn(),
  },
}));

describe("Market Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMarket", () => {
    const mockMarket: Market = {
      id: "1",
      name: "Test Market",
      totalVolume: Number(ethers.parseUnits("1000", 18)),
      totalPositions: 10,
      currentPrice: Number(ethers.parseUnits("100", 18)),
      priceHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it("should return cached market if available", async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(mockMarket));

      const result = await marketService.getMarket("1");
      expect(result).toEqual(mockMarket);
      expect(mockRedis.get).toHaveBeenCalledWith("market:1");
    });

    it("should fetch from contract if not cached", async () => {
      mockRedis.get.mockResolvedValue(null);
      (contractService.getMarketData as jest.Mock).mockResolvedValue(
        mockMarket
      );

      const result = await marketService.getMarket("1");
      expect(result).toEqual(mockMarket);
      expect(contractService.getMarketData).toHaveBeenCalledWith("1");
      expect(mockRedis.setex).toHaveBeenCalledWith(
        "market:1",
        expect.any(Number),
        JSON.stringify(mockMarket)
      );
    });
  });

  describe("getMarketPositions", () => {
    const mockPosition: Position = {
      id: "1",
      marketId: "1",
      trader: "0x123",
      amount: Number(ethers.parseUnits("100", 18)),
      entryPrice: Number(ethers.parseUnits("50", 18)),
      type: PositionType.LONG,
      status: PositionStatus.OPEN,
      createdAt: new Date().toISOString(),
      pnl: undefined,
      closedAt: undefined,
    };

    it("should return cached positions if available", async () => {
      const mockPositions = [mockPosition];
      mockRedis.get.mockResolvedValue(JSON.stringify(mockPositions));

      const result = await marketService.getMarketPositions("1");
      expect(result).toEqual(mockPositions);
      expect(mockRedis.get).toHaveBeenCalledWith("market:1:positions");
    });

    it("should fetch from subgraph if not cached", async () => {
      const mockPositions = [mockPosition];
      mockRedis.get.mockResolvedValue(null);
      (subgraphService.getMarketPositions as jest.Mock).mockResolvedValue(
        mockPositions
      );

      const result = await marketService.getMarketPositions("1");
      expect(result).toEqual(mockPositions);
      expect(subgraphService.getMarketPositions).toHaveBeenCalledWith("1");
      expect(mockRedis.setex).toHaveBeenCalledWith(
        "market:1:positions",
        expect.any(Number),
        JSON.stringify(mockPositions)
      );
    });
  });
});

describe("Market Event Handler", () => {
  let handler: MarketEventHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new MarketEventHandler();
    // Make private methods accessible for testing
    Object.assign(handler, {
      handlePriceUpdate: jest.fn(),
      handlePositionOpen: jest.fn(),
      handlePositionClose: jest.fn(),
    });
  });

  it("should handle price updates", async () => {
    const mockPrice = Number(ethers.parseUnits("100", 18));
    const mockTimestamp = Math.floor(Date.now() / 1000);

    await (handler as any).handlePriceUpdate("1", mockPrice, mockTimestamp);

    expect(mockRedis.setex).toHaveBeenCalledWith(
      "market:1:price",
      expect.any(Number),
      expect.any(String)
    );
  });

  it("should handle position opens", async () => {
    const mockPosition: Position = {
      id: "1",
      marketId: "1",
      trader: "0x123",
      amount: Number(ethers.parseUnits("100", 18)),
      entryPrice: Number(ethers.parseUnits("50", 18)),
      type: PositionType.LONG,
      status: PositionStatus.OPEN,
      createdAt: new Date().toISOString(),
      pnl: undefined,
      closedAt: undefined,
    };

    await (handler as any).handlePositionOpen(mockPosition);

    expect(mockRedis.setex).toHaveBeenCalledWith(
      "market:1:position:1",
      expect.any(Number),
      expect.stringContaining(mockPosition.id)
    );
  });

  it("should handle position closes", async () => {
    const mockPosition: Position = {
      id: "1",
      marketId: "1",
      trader: "0x123",
      amount: Number(ethers.parseUnits("100", 18)),
      entryPrice: Number(ethers.parseUnits("50", 18)),
      type: PositionType.LONG,
      status: PositionStatus.CLOSED,
      createdAt: new Date().toISOString(),
      closedAt: new Date().toISOString(),
      pnl: Number(ethers.parseUnits("10", 18)),
    };

    await (handler as any).handlePositionClose(mockPosition);

    expect(mockRedis.setex).toHaveBeenCalledWith(
      "market:1:position:1",
      expect.any(Number),
      expect.stringContaining(mockPosition.id)
    );
  });
});

describe("Market Config Service", () => {
  const mockAddress = "0x1234567890123456789012345678901234567890";
  const mockAbi = [
    "event PriceUpdated(uint256 price, uint256 timestamp)",
    "event PositionOpened(string positionId, address trader, uint256 amount, int256 leverage, uint256 entryPrice)",
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MARKET_ADDRESSES = JSON.stringify({
      "1": mockAddress,
    });
    marketConfig["marketConfigs"] = new Map();
    marketConfig["initializeMarketConfigs"]();
  });

  it("should get market address", () => {
    const address = marketConfig.getMarketAddress("1");
    expect(address).toBe(mockAddress);
  });

  it("should return undefined for non-existent market", () => {
    const address = marketConfig.getMarketAddress("999");
    expect(address).toBeUndefined();
  });

  it("should get market ABI", () => {
    const abi = marketConfig.getMarketABI();
    expect(Array.isArray(abi)).toBe(true);
    expect(abi.length).toBeGreaterThan(0);
  });

  it("should add market config", () => {
    const newMarketId = "2";
    const newConfig = {
      address: mockAddress,
      abi: mockAbi,
    };

    marketConfig.addMarketConfig(newMarketId, newConfig);
    const address = marketConfig.getMarketAddress(newMarketId);
    expect(address).toBe(mockAddress);
  });

  it("should remove market config", () => {
    const marketId = "1";
    expect(marketConfig.getMarketAddress(marketId)).toBeDefined();

    marketConfig.removeMarketConfig(marketId);
    expect(marketConfig.getMarketAddress(marketId)).toBeUndefined();
  });

  it("should get market IDs", () => {
    const ids = marketConfig.getMarketIds();
    expect(ids).toContain("1");
  });

  it("should pass health check with valid configs", () => {
    const result = marketConfig.healthCheck();
    expect(result).toBe(true);
  });

  it("should fail health check with invalid address", () => {
    marketConfig.addMarketConfig("invalid", {
      address: "invalid-address",
      abi: mockAbi,
    });
    const result = marketConfig.healthCheck();
    expect(result).toBe(false);
  });
});
