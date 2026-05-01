import type { OpportunityFound, RiskAssessment, DebateTier } from "../types/index.js";

export function selectDebateTier(opportunity: OpportunityFound, riskAssessment: RiskAssessment): DebateTier {
  if (opportunity.category === "arbitrage") return "fast";
  if (riskAssessment.riskScore <= 3 && opportunity.tvl > 10_000_000) return "fast";

  if (riskAssessment.riskScore >= 7) return "deep";
  if (opportunity.protocol === "unknown") return "deep";

  return "standard";
}
