export const YIELD_SWARM_REGISTRY = {
  address: "0xc6ae9fa287f7628a221526bafae9fb96e75b7b1e" as `0x${string}`,
  abi: [
    {
      name: "requestSwarm",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [],
      outputs: [{ name: "tokenIds", type: "uint256[4]" }],
    },
    {
      name: "getSwarmMembers",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "user", type: "address" }],
      outputs: [
        {
          name: "members",
          type: "tuple[]",
          components: [
            { name: "tokenId", type: "uint256" },
            { name: "agentType", type: "string" },
            { name: "metadataURI", type: "string" },
            { name: "registeredAt", type: "uint256" },
            { name: "user", type: "address" },
          ],
        },
      ],
    },
    {
      name: "getAgent",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "tokenId", type: "uint256" }],
      outputs: [
        {
          name: "agent",
          type: "tuple",
          components: [
            { name: "tokenId", type: "uint256" },
            { name: "agentType", type: "string" },
            { name: "metadataURI", type: "string" },
            { name: "registeredAt", type: "uint256" },
            { name: "user", type: "address" },
          ],
        },
      ],
    },
  ],
} as const;

export const SMART_ACCOUNT_FACTORY = {
  address: "0xBb85872CfA2dFa6DB73785d6731241A0653596f6" as `0x${string}`,
  abi: [
    {
      name: "createAccount",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "owner", type: "address" },
        { name: "salt", type: "uint256" },
      ],
      outputs: [{ name: "", type: "address" }],
    },
    {
      name: "getAddress",
      type: "function",
      stateMutability: "view",
      inputs: [
        { name: "owner", type: "address" },
        { name: "salt", type: "uint256" },
      ],
      outputs: [{ name: "", type: "address" }],
    },
  ],
} as const;

export const AGENT_TYPES = ["scout", "risk", "orchestrator", "executor"] as const;
export type AgentType = (typeof AGENT_TYPES)[number];

export const STRATEGY_VAULT = {
  address: "0x124332af824893b5030067df01eed6898ff36f51" as `0x${string}`,
  abi: [
    {
      name: "approveStrategy",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [{ name: "strategyId", type: "bytes32" }],
      outputs: [],
    },
    {
      name: "rejectStrategy",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "strategyId", type: "bytes32" },
        { name: "reason", type: "string" },
      ],
      outputs: [],
    },
    {
      name: "getStrategy",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "strategyId", type: "bytes32" }],
      outputs: [
        {
          name: "",
          type: "tuple",
          components: [
            { name: "strategyId", type: "bytes32" },
            { name: "actions", type: "tuple[]", components: [
              { name: "target", type: "address" },
              { name: "value", type: "uint256" },
              { name: "calldata_", type: "bytes" },
              { name: "minAmountOut", type: "uint256" },
            ]},
            { name: "estimatedAPY", type: "uint256" },
            { name: "riskScore", type: "uint8" },
            { name: "status", type: "uint8" },
            { name: "proposedAt", type: "uint256" },
            { name: "executedAt", type: "uint256" },
            { name: "proposedBy", type: "address" },
          ],
        },
      ],
    },
    {
      name: "getActiveStrategies",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "bytes32[]" }],
    },
    {
      name: "riskThreshold",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "uint8" }],
    },
    {
      name: "StrategyApproved",
      type: "event",
      inputs: [
        { name: "strategyId", type: "bytes32", indexed: true },
        { name: "approver", type: "address", indexed: false },
      ],
    },
    {
      name: "StrategyRejected",
      type: "event",
      inputs: [
        { name: "strategyId", type: "bytes32", indexed: true },
        { name: "reason", type: "string", indexed: false },
      ],
    },
  ],
} as const;

export const SESSION_KEY_MODULE = {
  address: "0x69096aa05f5f19dbad0fd43c1b18190a4119a438" as `0x${string}`,
  abi: [
    {
      name: "grantSessionKey",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "key", type: "address" },
        {
          name: "perms",
          type: "tuple",
          components: [
            { name: "maxSpendPerTx", type: "uint256" },
            { name: "maxTotalSpend", type: "uint256" },
            { name: "allowedTargets", type: "address[]" },
            { name: "validUntil", type: "uint256" },
            { name: "validAfter", type: "uint256" },
            { name: "totalSpent", type: "uint256" },
          ],
        },
      ],
      outputs: [],
    },
    {
      name: "isValidSessionKey",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "key", type: "address" }],
      outputs: [{ name: "", type: "bool" }],
    },
    {
      name: "getSessionKey",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "key", type: "address" }],
      outputs: [
        {
          name: "",
          type: "tuple",
          components: [
            { name: "maxSpendPerTx", type: "uint256" },
            { name: "maxTotalSpend", type: "uint256" },
            { name: "allowedTargets", type: "address[]" },
            { name: "validUntil", type: "uint256" },
            { name: "validAfter", type: "uint256" },
            { name: "totalSpent", type: "uint256" },
          ],
        },
      ],
    },
    {
      name: "revokeSessionKey",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [{ name: "key", type: "address" }],
      outputs: [],
    },
    {
      name: "SessionKeyGranted",
      type: "event",
      inputs: [
        { name: "key", type: "address", indexed: true },
        { name: "validUntil", type: "uint256", indexed: false },
      ],
    },
  ],
} as const;

export const SMART_ACCOUNT_EXECUTE_ABI = [
  {
    name: "execute",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "target", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    outputs: [{ name: "", type: "bytes" }],
  },
  {
    name: "setSessionModule",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "module", type: "address" }],
    outputs: [],
  },
  {
    name: "sessionModule",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;
