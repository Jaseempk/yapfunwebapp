import { sign, verify } from "jsonwebtoken";
import { randomBytes, hexlify, verifyMessage } from "ethers";
import { redis } from "../config/cache";
import { errorHandler } from "./error";
import { CACHE_PREFIX, CACHE_TTL } from "../config/cache";

interface AuthTokenPayload {
  userId: string;
  address: string;
  nonce: string;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
  private readonly JWT_EXPIRES_IN = "24h";
  private readonly NONCE_EXPIRES = 300; // 5 minutes

  async generateNonce(address: string): Promise<string> {
    const nonce = hexlify(randomBytes(32));
    const key = `${CACHE_PREFIX.USER}nonce:${address.toLowerCase()}`;

    await redis.setex(key, this.NONCE_EXPIRES, nonce);
    return nonce;
  }

  async verifySignature(address: string, signature: string): Promise<boolean> {
    const nonceKey = `${CACHE_PREFIX.USER}nonce:${address.toLowerCase()}`;
    const nonce = await redis.get(nonceKey);

    if (!nonce) {
      throw errorHandler.badRequest("Invalid or expired nonce");
    }

    // Message that was signed
    const message = `Sign this message to authenticate with YapFun\nNonce: ${nonce}`;

    try {
      // Recover the address from the signature
      const recoveredAddress = verifyMessage(message, signature);

      // Check if the recovered address matches the claimed address
      const isValid = recoveredAddress.toLowerCase() === address.toLowerCase();

      if (isValid) {
        // Delete the nonce after successful verification
        await redis.del(nonceKey);
      }

      return isValid;
    } catch (error) {
      throw errorHandler.badRequest("Invalid signature");
    }
  }

  generateToken(payload: AuthTokenPayload): string {
    return sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  verifyToken(token: string): AuthTokenPayload {
    try {
      return verify(token, this.JWT_SECRET) as AuthTokenPayload;
    } catch (error) {
      throw errorHandler.unauthorized("Invalid or expired token");
    }
  }

  async revokeToken(token: string): Promise<void> {
    const decoded = this.verifyToken(token);
    const blacklistKey = `${CACHE_PREFIX.USER}blacklist:${token}`;

    // Store in blacklist until the token expires
    const tokenExp = (decoded as any).exp;
    const now = Math.floor(Date.now() / 1000);
    const ttl = Math.max(0, tokenExp - now);

    await redis.setex(blacklistKey, ttl, "1");
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklistKey = `${CACHE_PREFIX.USER}blacklist:${token}`;
    return Boolean(await redis.get(blacklistKey));
  }

  // Middleware for GraphQL resolvers
  createAuthMiddleware(requiredRoles: string[] = []) {
    return async (
      resolve: Function,
      root: any,
      args: any,
      context: any,
      info: any
    ) => {
      const token = context.token;

      if (!token) {
        throw errorHandler.unauthorized("Authentication required");
      }

      // Check if token is blacklisted
      if (await this.isTokenBlacklisted(token)) {
        throw errorHandler.unauthorized("Token has been revoked");
      }

      try {
        const decoded = this.verifyToken(token);
        context.user = decoded;

        // Check roles if required
        if (requiredRoles.length > 0) {
          const hasRole = await this.checkUserRoles(
            decoded.userId,
            requiredRoles
          );
          if (!hasRole) {
            throw errorHandler.forbidden("Insufficient permissions");
          }
        }

        return resolve(root, args, context, info);
      } catch (error) {
        throw errorHandler.unauthorized("Invalid or expired token");
      }
    };
  }

  private async checkUserRoles(
    userId: string,
    requiredRoles: string[]
  ): Promise<boolean> {
    const userRolesKey = `${CACHE_PREFIX.USER}${userId}:roles`;
    const userRoles = await redis.smembers(userRolesKey);

    return requiredRoles.some((role) => userRoles.includes(role));
  }

  async assignRole(userId: string, role: string): Promise<void> {
    const userRolesKey = `${CACHE_PREFIX.USER}${userId}:roles`;
    await redis.sadd(userRolesKey, role);
  }

  async removeRole(userId: string, role: string): Promise<void> {
    const userRolesKey = `${CACHE_PREFIX.USER}${userId}:roles`;
    await redis.srem(userRolesKey, role);
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const userRolesKey = `${CACHE_PREFIX.USER}${userId}:roles`;
    return redis.smembers(userRolesKey);
  }
}

export const authService = new AuthService();
