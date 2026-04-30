import type { OpportunityFound } from "../types/index.js";

export interface ScoutAgentInput {
  agentId: string;
  memoryRootHash?: string;
}

export interface ScoutAgentOutput {
  opportunities: OpportunityFound[];
  error?: string;
}

export async function scoutAgent(_input: ScoutAgentInput): Promise<ScoutAgentOutput> {
  throw new Error("Not implemented");
}
