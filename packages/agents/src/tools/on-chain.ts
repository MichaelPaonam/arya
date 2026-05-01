import { createPublicClient, createWalletClient, http, type Address, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export interface RecordOutcomeParams {
  strategyId: string;
  success: boolean;
  actualReturn: number; // basis points (positive = profit, negative = loss)
  chainId: number;
}

export interface RecordOutcomeResult {
  txHash: string;
}

export interface AgentReputation {
  totalStrategies: number;
  wins: number;
  losses: number;
  winRate: number;
}

const STRATEGY_VAULT_ADDRESS = process.env["STRATEGY_VAULT_ADDRESS"] as Address ?? "0x";
const AGENT_REPUTATION_ADDRESS = process.env["AGENT_REPUTATION_ADDRESS"] as Address ?? "0x";

const STRATEGY_VAULT_ABI = [
  {
    name: "recordOutcome",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "strategyId", type: "bytes32" },
      { name: "success", type: "bool" },
      { name: "actualReturn", type: "int256" },
    ],
    outputs: [],
  },
] as const;

const AGENT_REPUTATION_ABI = [
  {
    name: "getScore",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [
      { name: "totalStrategies", type: "uint256" },
      { name: "wins", type: "uint256" },
      { name: "losses", type: "uint256" },
    ],
  },
] as const;

function getRpcUrl(chainId: number): string {
  if (chainId === 16602) return "https://evmrpc-testnet.0g.ai";
  return `https://eth-mainnet.g.alchemy.com/v2/${process.env["ALCHEMY_API_KEY"] ?? ""}`;
}

function getChain(chainId: number): Chain {
  return {
    id: chainId,
    name: chainId === 16602 ? "0G Galileo" : "Ethereum",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [getRpcUrl(chainId)] } },
  };
}

export async function recordOutcome(params: RecordOutcomeParams): Promise<RecordOutcomeResult> {
  const rpcUrl = getRpcUrl(params.chainId);
  const privateKey = process.env["ORCHESTRATOR_PRIVATE_KEY"];
  if (!privateKey) {
    throw new Error("ORCHESTRATOR_PRIVATE_KEY is required");
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: getChain(params.chainId),
    transport: http(rpcUrl),
  });

  const strategyIdBytes = `0x${Buffer.from(params.strategyId).toString("hex").padEnd(64, "0")}` as `0x${string}`;

  const txHash = await walletClient.writeContract({
    address: STRATEGY_VAULT_ADDRESS,
    abi: STRATEGY_VAULT_ABI,
    functionName: "recordOutcome",
    args: [strategyIdBytes, params.success, BigInt(params.actualReturn)],
  });

  return { txHash };
}

export async function getAgentReputation(agentId: string): Promise<AgentReputation> {
  const client = createPublicClient({
    transport: http(getRpcUrl(16602)),
  });

  const result = await client.readContract({
    address: AGENT_REPUTATION_ADDRESS,
    abi: AGENT_REPUTATION_ABI,
    functionName: "getScore",
    args: [BigInt(agentId)],
  });

  const [totalStrategies, wins, losses] = result;
  const total = Number(totalStrategies);
  const w = Number(wins);
  const l = Number(losses);

  return {
    totalStrategies: total,
    wins: w,
    losses: l,
    winRate: total > 0 ? Math.round((w / total) * 100) : 0,
  };
}
