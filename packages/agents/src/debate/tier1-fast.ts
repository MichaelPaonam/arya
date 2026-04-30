import type { OpportunityFound, RiskAssessment, DebateOutcome } from "../types/index.js";

export interface Tier1Input {
  opportunity: OpportunityFound;
  riskAssessment: RiskAssessment;
}

export async function runTier1(_input: Tier1Input): Promise<DebateOutcome> {
  throw new Error("Not implemented");
}
