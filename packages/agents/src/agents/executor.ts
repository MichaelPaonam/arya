import type { StrategyProposal, ExecutionResult } from "../types/index.js";

export interface GasConfig {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}

export interface ExecutorAgentInput {
  proposal: StrategyProposal;
  walletAddress: string;
  chainId: number;
  sessionKeyAddress?: string;
  gasConfig?: GasConfig;
}

export interface ExecutorAgentOutput extends ExecutionResult {
  approvalRequired?: boolean;
  autoExecuted?: boolean;
}

export async function executorAgent(_input: ExecutorAgentInput): Promise<ExecutorAgentOutput> {
  throw new Error("Not implemented");
}
