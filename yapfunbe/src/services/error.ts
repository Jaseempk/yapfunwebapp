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
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public data?: any
  ) {
    super(message);
    this.name = "AppError";
  }

  toGraphQLError(): GraphQLError {
    return new GraphQLError(this.message, {
      extensions: {
        code: this.code,
        statusCode: this.statusCode,
        data: this.data,
      },
    });
  }
}

export const errorHandler = {
  handle(error: any): GraphQLError {
    console.error("Error:", error);

    if (error instanceof AppError) {
      return error.toGraphQLError();
    }

    // Handle Web3/Contract errors
    if (error.code === "CALL_EXCEPTION" || error.code === "NETWORK_ERROR") {
      return new AppError(
        ErrorCode.CONTRACT_ERROR,
        "Blockchain interaction failed",
        500,
        { originalError: error.message }
      ).toGraphQLError();
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      return new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Invalid input data",
        400,
        { details: error.details }
      ).toGraphQLError();
    }

    // Default error
    return new AppError(
      ErrorCode.INTERNAL_ERROR,
      "An unexpected error occurred",
      500
    ).toGraphQLError();
  },

  notFound(resource: string): AppError {
    return new AppError(ErrorCode.NOT_FOUND, `${resource} not found`, 404);
  },

  unauthorized(message = "Unauthorized"): AppError {
    return new AppError(ErrorCode.UNAUTHORIZED, message, 401);
  },

  forbidden(message = "Forbidden"): AppError {
    return new AppError(ErrorCode.FORBIDDEN, message, 403);
  },

  badRequest(message: string, data?: any): AppError {
    return new AppError(ErrorCode.BAD_REQUEST, message, 400, data);
  },

  rateLimited(message = "Too many requests"): AppError {
    return new AppError(ErrorCode.RATE_LIMITED, message, 429);
  },
};
