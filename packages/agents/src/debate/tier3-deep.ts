import type { OpportunityFound, RiskAssessment, DebateOutcome, Challenge, ChallengeResponse } from "../types/index.js";
import { chatCompletion } from "../utils/llm.js";

export interface Tier3Input {
  opportunity: OpportunityFound;
  riskAssessment: RiskAssessment;
  riskAgentId: string;
  scoutAgentId: string;
  orchestratorAgentId: string;
  maxRounds: number;
  timeoutMs?: number;
}

export async function runTier3(input: Tier3Input): Promise<DebateOutcome> {
  const start = Date.now();
  const timeout = input.timeoutMs ?? 45_000;
  const debateLog: (Challenge | ChallengeResponse)[] = [];
  let challengesRaised = 0;
  let challengesSurvived = 0;
  let timedOut = false;

  for (let round = 0; round < input.maxRounds; round++) {
    if (Date.now() - start >= timeout) {
      timedOut = true;
      break;
    }

    // Risk generates challenge
    let challengeResult;
    try {
      challengeResult = await Promise.race([
        chatCompletion({
          messages: [
            {
              role: "system",
              content: "You are a DeFi risk challenger in a debate. Generate a challenge for this opportunity. Return JSON with: challengeType (data_contradiction|risk_underestimate|assumption_invalid|correlation_risk), evidence (string), severity (low|medium|high).",
            },
            {
              role: "user",
              content: JSON.stringify({
                opportunity: input.opportunity,
                riskAssessment: input.riskAssessment,
                previousDebate: debateLog,
                round: round + 1,
              }),
            },
          ],
          temperature: 0.3,
          maxTokens: 512,
          responseFormat: { type: "json_object" },
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), timeout - (Date.now() - start))),
      ]);
    } catch {
      timedOut = true;
      break;
    }

    const parsedChallenge = challengeResult as { challengeType: string; evidence: string; severity: string };
    const challenge: Challenge = {
      challengerId: input.riskAgentId,
      targetStrategyId: input.opportunity.id,
      challengeType: parsedChallenge.challengeType as Challenge["challengeType"],
      evidence: parsedChallenge.evidence,
      severity: parsedChallenge.severity as Challenge["severity"],
    };
    debateLog.push(challenge);
    challengesRaised++;

    if (Date.now() - start >= timeout) {
      timedOut = true;
      break;
    }

    // Scout responds
    let responseResult;
    try {
      responseResult = await Promise.race([
        chatCompletion({
          messages: [
            {
              role: "system",
              content: "You are a DeFi scout defending your opportunity proposal. Respond to the challenge. Return JSON with: response (\"concede\" or \"counter\"), counterEvidence (string, only if counter).",
            },
            {
              role: "user",
              content: JSON.stringify({
                opportunity: input.opportunity,
                challenge,
                previousDebate: debateLog,
              }),
            },
          ],
          temperature: 0.3,
          maxTokens: 512,
          responseFormat: { type: "json_object" },
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), timeout - (Date.now() - start))),
      ]);
    } catch {
      timedOut = true;
      break;
    }

    const parsedResponse = responseResult as { response: string; counterEvidence?: string };
    const challengeResponse: ChallengeResponse = {
      responderId: input.scoutAgentId,
      challengeId: `${input.opportunity.id}-${round}`,
      response: parsedResponse.response as ChallengeResponse["response"],
      counterEvidence: parsedResponse.counterEvidence,
    };
    debateLog.push(challengeResponse);

    if (parsedResponse.response === "counter") {
      challengesSurvived++;
    }

    // If Scout concedes, end debate early
    if (parsedResponse.response === "concede") {
      break;
    }
  }

  // Orchestrator scores the debate
  let confidenceScore = 0.5;
  if (!timedOut) {
    try {
      const scoreResult = await Promise.race([
        chatCompletion({
          messages: [
            {
              role: "system",
              content: "You are a debate judge. Score the overall confidence in this opportunity based on the debate. Return JSON with: confidenceScore (0 to 1).",
            },
            {
              role: "user",
              content: JSON.stringify({ debateLog, opportunity: input.opportunity }),
            },
          ],
          temperature: 0,
          maxTokens: 128,
          responseFormat: { type: "json_object" },
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), Math.max(1000, timeout - (Date.now() - start)))),
      ]);
      confidenceScore = (scoreResult as { confidenceScore: number }).confidenceScore;
    } catch {
      // Fallback scoring based on debate outcome
      confidenceScore = challengesRaised > 0
        ? challengesSurvived / challengesRaised
        : 0.5;
    }
  }

  return {
    strategyId: input.opportunity.id,
    tier: "deep",
    challengesRaised,
    challengesSurvived,
    confidenceScore,
    latencyMs: Date.now() - start,
    debateLog,
  };
}
