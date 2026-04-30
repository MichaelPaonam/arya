import type { OpportunityFound, RiskAssessment } from "../types/index.js";

export interface RiskAgentInput {
  opportunity: OpportunityFound;
  agentId: string;
  memoryRootHash?: string;
}

export interface RiskAgentOutput {
  assessment: RiskAssessment;
}

export async function riskAgent(_input: RiskAgentInput): Promise<RiskAgentOutput> {
  throw new Error("Not implemented");
}
