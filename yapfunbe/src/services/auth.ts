import { redis, CACHE_PREFIX, CACHE_TTL } from "../config/cache";
import { errorHandler } from "./error";

interface User {
  userId: string;
  address: string;
  nonce?: string;
  [key: string]: any;
}

export const authService = {
  async validateToken(token: string): Promise<boolean> {
    try {
      const key = `${CACHE_PREFIX.AUTH}${token}`;
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error) {
      console.error("Error validating token:", error);
      throw errorHandler.handle(error);
    }
  },

  async verifyToken(token: string): Promise<User> {
    try {
      const key = `${CACHE_PREFIX.AUTH}${token}`;
      const userData = await redis.get(key);
      if (!userData) {
        throw new Error("Invalid or expired token");
      }
      const user = JSON.parse(userData);
      return {
        userId: user.id,
        address: user.address,
        nonce: user.nonce,
      };
    } catch (error) {
      console.error("Error verifying token:", error);
      throw errorHandler.handle(error);
    }
  },

  async getUserFromToken(
    token: string
  ): Promise<{ id: string; address: string }> {
    try {
      const key = `${CACHE_PREFIX.AUTH}${token}`;
      const userData = await redis.get(key);
      if (!userData) {
        throw new Error("Invalid or expired token");
      }
      return JSON.parse(userData);
    } catch (error) {
      console.error("Error getting user from token:", error);
      throw errorHandler.handle(error);
    }
  },

  async revokeToken(token: string): Promise<void> {
    try {
      const key = `${CACHE_PREFIX.AUTH}${token}`;
      await redis.del(key);
    } catch (error) {
      console.error("Error revoking token:", error);
      throw errorHandler.handle(error);
    }
  },

  async storeToken(
    token: string,
    userData: { id: string; address: string; nonce?: string }
  ): Promise<void> {
    try {
      const key = `${CACHE_PREFIX.AUTH}${token}`;
      await redis.setex(key, CACHE_TTL.AUTH, JSON.stringify(userData));
    } catch (error) {
      console.error("Error storing token:", error);
      throw errorHandler.handle(error);
    }
  },

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const testKey = `${CACHE_PREFIX.AUTH}health`;
      await redis.setex(testKey, 5, "1");
      const result = await redis.get(testKey);
      await redis.del(testKey);
      return result === "1";
    } catch (error) {
      console.error("Auth service health check failed:", error);
      return false;
    }
  },
};
