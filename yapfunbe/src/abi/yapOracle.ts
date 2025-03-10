export const yapOracleCA = "0xDa1B4fFfAF462D5c39c2c06b33b1d400c0E04aB7";

export const yapOracleAbi = [
  {
    inputs: [{ internalType: "address", name: "updater", type: "address" }],
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
  { inputs: [], name: "YO__InvalidParams", type: "error" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "kolId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "rank",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "mindshareScore",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "CrashedOutKolDataUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "kolId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "rank",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "mindshareScore",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "KOLDataUpdated",
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
    name: "MAX_UPDATE_DELAY",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "UPDATER_ROLE",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "kolId", type: "uint256" }],
    name: "getKOLData",
    outputs: [
      { internalType: "uint256", name: "rank", type: "uint256" },
      { internalType: "uint256", name: "mindshareScore", type: "uint256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "bool", name: "isStale", type: "bool" },
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
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "kolData",
    outputs: [
      { internalType: "uint256", name: "rank", type: "uint256" },
      { internalType: "uint256", name: "mindshareScore", type: "uint256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "uint256", name: "updateBlock", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "lastUpdateTime",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
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
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_currentUpdater", type: "address" },
    ],
    name: "revokeUpdaterRole",
    outputs: [],
    stateMutability: "nonpayable",
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
    inputs: [
      { internalType: "uint256", name: "kolId", type: "uint256" },
      { internalType: "uint256", name: "rank", type: "uint256" },
      { internalType: "uint256", name: "mindshare", type: "uint256" },
    ],
    name: "updateCrashedOutKolData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256[]", name: "kolIds", type: "uint256[]" },
      { internalType: "uint256[]", name: "ranks", type: "uint256[]" },
      { internalType: "uint256[]", name: "mindshareScores", type: "uint256[]" },
    ],
    name: "updateKOLData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_newUpdater", type: "address" }],
    name: "updateUpdater",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
