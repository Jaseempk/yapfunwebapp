export const orderBookAbi = [
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
  {
    inputs: [],
    name: "marketVolume",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
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
];
