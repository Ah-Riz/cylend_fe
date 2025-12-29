export const LendingCoreAbi = [
  // positions(user, token) -> (collateral, borrow, supplyIndexSnapshot, borrowIndexSnapshot)
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
    ],
    name: "positions",
    outputs: [
      { internalType: "uint256", name: "collateral", type: "uint256" },
      { internalType: "uint256", name: "borrow", type: "uint256" },
      { internalType: "uint256", name: "supplyIndexSnapshot", type: "uint256" },
      { internalType: "uint256", name: "borrowIndexSnapshot", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;


