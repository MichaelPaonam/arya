import type { OpportunityFound, RiskAssessment, DebateOutcome } from "../types/index.js";

export interface Tier1Input {
  opportunity: OpportunityFound;
  riskAssessment: RiskAssessment;
}

export async function runTier1(input: Tier1Input): Promise<DebateOutcome> {
  const start = Date.now();

  // Rule-based confidence: inverse of risk score normalized to 0-1
  const confidenceScore = Math.max(0.1, 1 - (input.riskAssessment.riskScore / 10));

  return {
    strategyId: input.opportunity.id,
    tier: "fast",
    challengesRaised: 0,
    challengesSurvived: 0,
    confidenceScore,
    latencyMs: Date.now() - start,
    debateLog: [],
  };
}
