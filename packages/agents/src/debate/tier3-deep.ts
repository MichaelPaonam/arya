import type { OpportunityFound, RiskAssessment, DebateOutcome } from "../types/index.js";

export interface Tier3Input {
  opportunity: OpportunityFound;
  riskAssessment: RiskAssessment;
  riskAgentId: string;
  scoutAgentId: string;
  orchestratorAgentId: string;
  maxRounds: number;
  timeoutMs?: number;
}

export async function runTier3(_input: Tier3Input): Promise<DebateOutcome> {
  throw new Error("Not implemented");
}
