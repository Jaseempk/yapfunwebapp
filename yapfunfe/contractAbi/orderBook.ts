export const obCA = "0xb46B77179ef9A486F2C6E3Acc3F605526dcdE17E";
export const obAbi = [
  {
    inputs: [
      { internalType: "address", name: "_stablecoin", type: "address" },
      { internalType: "address", name: "_feeCollector", type: "address" },
      { internalType: "address", name: "_escrow", type: "address" },
      { internalType: "address", name: "yapOracle", type: "address" },
      { internalType: "uint256", name: "_kolId", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "AccessControlBadConfirmation", type: "error" },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "bytes32", name: "neededRole", type: "bytes32" },
    ],
    name: "AccessControlUnauthorizedAccount",
    type: "error",
  },
  { inputs: [], name: "YOB__CallerIsNotTrader", type: "error" },
  { inputs: [], name: "YOB__CantCloseBeforeExpiry", type: "error" },
  { inputs: [], name: "YOB__CantResetActiveMarket", type: "error" },
  { inputs: [], name: "YOB__DATA_EXPIRED", type: "error" },
  { inputs: [], name: "YOB__INVALIDSIZE", type: "error" },
  { inputs: [], name: "YOB__INVALID_TRADER", type: "error" },
  { inputs: [], name: "YOB__Insufficient_Liquidity", type: "error" },
  { inputs: [], name: "YOB__InvalidOrder", type: "error" },
  { inputs: [], name: "YOB__InvalidPosition", type: "error" },
  { inputs: [], name: "YOB__MindshareArrayEmpty", type: "error" },
  { inputs: [], name: "YOB__OrderYetToBeFilled", type: "error" },
  { inputs: [], name: "YOB__WithdrawalAmountTooHigh", type: "error" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountWithdrawn",
        type: "uint256",
      },
    ],
    name: "FeeWithdrawalInitiated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "MarketReset",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
      {
        components: [
          { internalType: "address", name: "trader", type: "address" },
          { internalType: "uint256", name: "positionId", type: "uint256" },
          { internalType: "uint256", name: "kolId", type: "uint256" },
          { internalType: "bool", name: "isLong", type: "bool" },
          { internalType: "uint256", name: "mindshareValue", type: "uint256" },
          { internalType: "uint256", name: "quantity", type: "uint256" },
          { internalType: "uint256", name: "filledQuantity", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          {
            internalType: "enum YapOrderBook.OrderStatus",
            name: "status",
            type: "uint8",
          },
        ],
        indexed: false,
        internalType: "struct YapOrderBook.Order",
        name: "order",
        type: "tuple",
      },
    ],
    name: "OrderCanceled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "trader",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "kolId",
        type: "uint256",
      },
      { indexed: false, internalType: "bool", name: "isLong", type: "bool" },
      {
        indexed: false,
        internalType: "uint256",
        name: "mindshareValue",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "quantity",
        type: "uint256",
      },
    ],
    name: "OrderCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "filledQuantity",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "counterpartyTrader",
        type: "address",
      },
    ],
    name: "OrderFilled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "market",
        type: "address",
      },
      { indexed: false, internalType: "int256", name: "pnl", type: "int256" },
      {
        indexed: false,
        internalType: "uint256",
        name: "positionId",
        type: "uint256",
      },
    ],
    name: "PositionClosed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "role", type: "bytes32" },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MARKET_DURATION",
    outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "_getOraclePrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "activeOrderCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_orderId", type: "uint256" }],
    name: "cancelOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "positionId", type: "uint256" }],
    name: "closePosition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bool", name: "_isLong", type: "bool" },
      { internalType: "uint256", name: "_quantity", type: "uint256" },
    ],
    name: "createOrder",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "escrow",
    outputs: [
      { internalType: "contract IYapEscrow", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "expiryDuration",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeCollector",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feePercentage",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getActiveOrderCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bool", name: "isLong", type: "bool" },
      { internalType: "uint256", name: "mindshare", type: "uint256" },
    ],
    name: "getOrderCountForMindshare",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_orderId", type: "uint256" }],
    name: "getOrderDetails",
    outputs: [
      { internalType: "address", name: "trader", type: "address" },
      { internalType: "uint256", name: "_kolId", type: "uint256" },
      { internalType: "bool", name: "isLong", type: "bool" },
      { internalType: "uint256", name: "mindshareValue", type: "uint256" },
      { internalType: "uint256", name: "quantity", type: "uint256" },
      { internalType: "uint256", name: "filledQuantity", type: "uint256" },
      {
        internalType: "enum YapOrderBook.OrderStatus",
        name: "status",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "role", type: "bytes32" }],
    name: "getRoleAdmin",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "hasRole",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "marketVolume",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "oracle",
    outputs: [
      { internalType: "contract IYapOracle", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "orders",
    outputs: [
      { internalType: "address", name: "trader", type: "address" },
      { internalType: "uint256", name: "positionId", type: "uint256" },
      { internalType: "uint256", name: "kolId", type: "uint256" },
      { internalType: "bool", name: "isLong", type: "bool" },
      { internalType: "uint256", name: "mindshareValue", type: "uint256" },
      { internalType: "uint256", name: "quantity", type: "uint256" },
      { internalType: "uint256", name: "filledQuantity", type: "uint256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      {
        internalType: "enum YapOrderBook.OrderStatus",
        name: "status",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "callerConfirmation", type: "address" },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256[]", name: "mindshares", type: "uint256[]" },
    ],
    name: "resetMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "stablecoin",
    outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalFeeCollected",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountToWithdraw", type: "uint256" },
    ],
    name: "withdrawFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
