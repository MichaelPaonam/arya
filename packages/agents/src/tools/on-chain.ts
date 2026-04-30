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

export async function recordOutcome(_params: RecordOutcomeParams): Promise<RecordOutcomeResult> {
  throw new Error("Not implemented");
}

export async function getAgentReputation(_agentId: string): Promise<AgentReputation> {
  throw new Error("Not implemented");
}
