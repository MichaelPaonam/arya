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
  address: "0x3445a25b9b07a302766fb99406f088f544094c7e" as `0x${string}`,
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
