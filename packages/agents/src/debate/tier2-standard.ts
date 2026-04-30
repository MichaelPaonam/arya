import type { OpportunityFound, RiskAssessment, DebateOutcome } from "../types/index.js";

export interface Tier2Input {
  opportunity: OpportunityFound;
  riskAssessment: RiskAssessment;
  riskAgentId: string;
  timeoutMs?: number;
}

export async function runTier2(_input: Tier2Input): Promise<DebateOutcome> {
  throw new Error("Not implemented");
}
