import { GraphQLError } from "graphql";

export enum ErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  BAD_REQUEST = "BAD_REQUEST",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  RATE_LIMITED = "RATE_LIMITED",
  CONTRACT_ERROR = "CONTRACT_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  CACHE_ERROR = "CACHE_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR"
}

export interface ErrorMetadata {
  code: ErrorCode;
  statusCode: number;
  context?: Record<string, any>;
  timestamp: number;
  originalError?: Error;
}

export class AppError extends Error {
  public readonly metadata: ErrorMetadata;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    context?: Record<string, any>,
    originalError?: Error
  ) {
    super(message);
    this.name = "AppError";
    
    this.metadata = {
      code,
      statusCode,
      context,
      timestamp: Date.now(),
      originalError
    };

    // Preserve the original stack trace if we have an original error
    if (originalError?.stack) {
      this.stack = originalError.stack;
    }
  }

  toGraphQLError(): GraphQLError {
    return new GraphQLError(this.message, {
      extensions: {
        ...this.metadata,
        // Don't expose internal error details in production
        originalError: process.env.NODE_ENV === "development" ? this.metadata.originalError : undefined
      },
    });
  }
}

export const errorHandler = {
  handle(error: any): GraphQLError {
    // Already handled errors
    if (error instanceof AppError) {
      return error.toGraphQLError();
    }

    // Web3/Contract errors
    if (error.code === "CALL_EXCEPTION" || error.code === "NETWORK_ERROR") {
      return new AppError(
        ErrorCode.CONTRACT_ERROR,
        "Blockchain interaction failed",
        500,
        { errorCode: error.code, method: error.method },
        error
      ).toGraphQLError();
    }

    // Validation errors
    if (error.name === "ValidationError") {
      return new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Invalid input data",
        400,
        { details: error.details },
        error
      ).toGraphQLError();
    }

    // Network errors
    if (error.name === "NetworkError" || error.message?.includes("network")) {
      return new AppError(
        ErrorCode.NETWORK_ERROR,
        "Network request failed",
        503,
        { url: error.url, method: error.method },
        error
      ).toGraphQLError();
    }

    // Cache errors
    if (error.name === "RedisError" || error.message?.includes("redis")) {
      return new AppError(
        ErrorCode.CACHE_ERROR,
        "Cache operation failed",
        500,
        { operation: error.command },
        error
      ).toGraphQLError();
    }

    // Default error
    return new AppError(
      ErrorCode.INTERNAL_ERROR,
      "An unexpected error occurred",
      500,
      undefined,
      error
    ).toGraphQLError();
  },

  handleGraphQLError(error: any): GraphQLError {
    if (error instanceof GraphQLError) {
      return error;
    }
    return this.handle(error);
  },

  notFound(resource: string, context?: Record<string, any>): AppError {
    return new AppError(
      ErrorCode.NOT_FOUND,
      `${resource} not found`,
      404,
      context
    );
  },

  unauthorized(message = "Unauthorized", context?: Record<string, any>): AppError {
    return new AppError(
      ErrorCode.UNAUTHORIZED,
      message,
      401,
      context
    );
  },

  forbidden(message = "Forbidden", context?: Record<string, any>): AppError {
    return new AppError(
      ErrorCode.FORBIDDEN,
      message,
      403,
      context
    );
  },

  badRequest(message: string, context?: Record<string, any>): AppError {
    return new AppError(
      ErrorCode.BAD_REQUEST,
      message,
      400,
      context
    );
  },

  rateLimited(message = "Too many requests", context?: Record<string, any>): AppError {
    return new AppError(
      ErrorCode.RATE_LIMITED,
      message,
      429,
      context
    );
  }
};
