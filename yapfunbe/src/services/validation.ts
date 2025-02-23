import { ethers } from "ethers";
import { errorHandler } from "./error";

interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

interface ValidationSchema {
  [key: string]: ValidationRule<any>[];
}

export class ValidationService {
  // Address validation
  private readonly addressRules: ValidationRule<string>[] = [
    {
      validate: (value) => Boolean(value && value.length > 0),
      message: "Address is required",
    },
    {
      validate: (value) => ethers.isAddress(value),
      message: "Invalid Ethereum address",
    },
  ];

  // Amount validation
  private readonly amountRules: ValidationRule<number>[] = [
    {
      validate: (value) => !isNaN(value),
      message: "Amount must be a number",
    },
    {
      validate: (value) => value > 0,
      message: "Amount must be greater than 0",
    },
  ];

  // Price validation
  private readonly priceRules: ValidationRule<number>[] = [
    {
      validate: (value) => !isNaN(value),
      message: "Price must be a number",
    },
    {
      validate: (value) => value > 0,
      message: "Price must be greater than 0",
    },
  ];

  // Signature validation
  private readonly signatureRules: ValidationRule<string>[] = [
    {
      validate: (value) => Boolean(value && value.length > 0),
      message: "Signature is required",
    },
    {
      validate: (value) => value.startsWith("0x"),
      message: "Invalid signature format",
    },
    {
      validate: (value) => value.length === 132,
      message: "Invalid signature length",
    },
  ];

  // Market validation
  private readonly marketRules: ValidationRule<string>[] = [
    {
      validate: (value) => Boolean(value && value.length > 0),
      message: "Market ID is required",
    },
    {
      validate: (value) => value.length <= 100,
      message: "Market ID is too long",
    },
  ];

  // Position validation
  private readonly positionRules: ValidationRule<{
    marketId: string;
    amount: number;
    leverage: number;
    type: string;
  }>[] = [
    {
      validate: (value) => Boolean(value.marketId && value.marketId.length > 0),
      message: "Market ID is required",
    },
    {
      validate: (value) => value.amount > 0,
      message: "Position amount must be greater than 0",
    },
    {
      validate: (value) => value.leverage >= 1 && value.leverage <= 100,
      message: "Leverage must be between 1x and 100x",
    },
    {
      validate: (value) => ["LONG", "SHORT"].includes(value.type),
      message: "Position type must be either LONG or SHORT",
    },
  ];

  // Order validation
  private readonly orderRules: ValidationRule<{
    marketId: string;
    amount: number;
    price: number;
    type: string;
  }>[] = [
    {
      validate: (value) => Boolean(value.marketId && value.marketId.length > 0),
      message: "Market ID is required",
    },
    {
      validate: (value) => value.amount > 0,
      message: "Order amount must be greater than 0",
    },
    {
      validate: (value) => value.price > 0,
      message: "Order price must be greater than 0",
    },
    {
      validate: (value) => ["LIMIT", "MARKET"].includes(value.type),
      message: "Order type must be either LIMIT or MARKET",
    },
  ];

  // Generic validation method
  private validate<T>(value: T, rules: ValidationRule<T>[]): void {
    for (const rule of rules) {
      if (!rule.validate(value)) {
        throw errorHandler.badRequest(rule.message);
      }
    }
  }

  // Public validation methods
  validateAddress(address: string): void {
    this.validate(address, this.addressRules);
  }

  validateAmount(amount: number): void {
    this.validate(amount, this.amountRules);
  }

  validatePrice(price: number): void {
    this.validate(price, this.priceRules);
  }

  validateSignature(signature: string): void {
    this.validate(signature, this.signatureRules);
  }

  validateMarket(marketId: string): void {
    this.validate(marketId, this.marketRules);
  }

  validatePosition(position: {
    marketId: string;
    amount: number;
    leverage: number;
    type: string;
  }): void {
    this.validate(position, this.positionRules);
  }

  validateOrder(order: {
    marketId: string;
    amount: number;
    price: number;
    type: string;
  }): void {
    this.validate(order, this.orderRules);
  }

  // Schema validation
  validateSchema<T extends object>(data: T, schema: ValidationSchema): void {
    for (const [key, rules] of Object.entries(schema)) {
      if (key in data) {
        this.validate(data[key as keyof T], rules);
      } else {
        throw errorHandler.badRequest(`Missing required field: ${key}`);
      }
    }
  }

  // Custom validation rules
  createRule<T>(
    validate: (value: T) => boolean,
    message: string
  ): ValidationRule<T> {
    return { validate, message };
  }

  // Validation schemas for common operations
  readonly createPositionSchema: ValidationSchema = {
    marketId: this.marketRules,
    amount: this.amountRules,
    leverage: [
      {
        validate: (value: number) => value >= 1 && value <= 100,
        message: "Leverage must be between 1x and 100x",
      },
    ],
    type: [
      {
        validate: (value: string) => ["LONG", "SHORT"].includes(value),
        message: "Position type must be either LONG or SHORT",
      },
    ],
  };

  readonly createOrderSchema: ValidationSchema = {
    marketId: this.marketRules,
    amount: this.amountRules,
    price: this.priceRules,
    type: [
      {
        validate: (value: string) => ["LIMIT", "MARKET"].includes(value),
        message: "Order type must be either LIMIT or MARKET",
      },
    ],
  };

  readonly updateOrderSchema: ValidationSchema = {
    orderId: [
      {
        validate: (value: string) => Boolean(value && value.length > 0),
        message: "Order ID is required",
      },
    ],
    price: this.priceRules,
  };

  readonly cancelOrderSchema: ValidationSchema = {
    orderId: [
      {
        validate: (value: string) => Boolean(value && value.length > 0),
        message: "Order ID is required",
      },
    ],
  };
}

export const validationService = new ValidationService();
