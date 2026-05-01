import type { OpportunityFound, RiskAssessment, DebateOutcome, Challenge } from "../types/index.js";
import { chatCompletion } from "../utils/llm.js";

export interface Tier2Input {
  opportunity: OpportunityFound;
  riskAssessment: RiskAssessment;
  riskAgentId: string;
  timeoutMs?: number;
}

export async function runTier2(input: Tier2Input): Promise<DebateOutcome> {
  const start = Date.now();
  const timeout = input.timeoutMs ?? 10_000;

  let challenge: Challenge | null = null;

  try {
    const result = await Promise.race([
      chatCompletion({
        messages: [
          {
            role: "system",
            content: "You are a DeFi risk challenger. Generate one challenge for this opportunity. Return JSON with: challengeType (data_contradiction|risk_underestimate|assumption_invalid|correlation_risk), evidence (string), severity (low|medium|high).",
          },
          {
            role: "user",
            content: JSON.stringify({ opportunity: input.opportunity, riskAssessment: input.riskAssessment }),
          },
        ],
        temperature: 0.3,
        maxTokens: 512,
        responseFormat: { type: "json_object" },
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), timeout)),
    ]);

    const parsed = result as { challengeType: string; evidence: string; severity: string };
    challenge = {
      challengerId: input.riskAgentId,
      targetStrategyId: input.opportunity.id,
      challengeType: parsed.challengeType as Challenge["challengeType"],
      evidence: parsed.evidence,
      severity: parsed.severity as Challenge["severity"],
    };
  } catch {
    // Timeout or error — produce outcome with no challenges
  }

  const latencyMs = Date.now() - start;

  return {
    strategyId: input.opportunity.id,
    tier: "standard",
    challengesRaised: challenge ? 1 : 0,
    challengesSurvived: challenge ? 0 : 0,
    confidenceScore: challenge ? 0.7 : 0.85,
    latencyMs,
    debateLog: challenge ? [challenge] : [],
  };
}
