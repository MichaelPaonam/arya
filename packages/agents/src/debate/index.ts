import type { OpportunityFound, RiskAssessment, DebateOutcome, DebateTier } from "../types/index.js";
import { runTier1 } from "./tier1-fast.js";
import { runTier2 } from "./tier2-standard.js";
import { runTier3 } from "./tier3-deep.js";

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

export async function runDebate(input: RunDebateInput): Promise<DebateOutcome> {
  switch (input.tier) {
    case "fast":
      return runTier1({
        opportunity: input.opportunity,
        riskAssessment: input.riskAssessment,
      });

    case "standard":
      return runTier2({
        opportunity: input.opportunity,
        riskAssessment: input.riskAssessment,
        riskAgentId: input.riskAgentId,
      });

    case "deep":
      return runTier3({
        opportunity: input.opportunity,
        riskAssessment: input.riskAssessment,
        riskAgentId: input.riskAgentId,
        scoutAgentId: input.scoutAgentId,
        orchestratorAgentId: input.orchestratorAgentId,
        maxRounds: 3,
      });
  }
}
