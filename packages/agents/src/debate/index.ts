import type { OpportunityFound, RiskAssessment, DebateOutcome, DebateTier } from "../types/index.js";

export { selectDebateTier } from "./router.js";
export { runTier1 } from "./tier1-fast.js";
export { runTier2 } from "./tier2-standard.js";
export { runTier3 } from "./tier3-deep.js";

export interface RunDebateInput {
  opportunity: OpportunityFound;
  riskAssessment: RiskAssessment;
  tier: DebateTier;
  riskAgentId: string;
  scoutAgentId: string;
  orchestratorAgentId: string;
}

export async function runDebate(_input: RunDebateInput): Promise<DebateOutcome> {
  throw new Error("Not implemented");
}
