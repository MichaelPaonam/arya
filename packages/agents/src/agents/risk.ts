import type { OpportunityFound, RiskAssessment } from "../types/index.js";
import { fetchPoolHistory } from "../tools/defillama.js";
import { calculateIL } from "../utils/impermanent-loss.js";
import { chatCompletion } from "../utils/llm.js";

export interface RiskAgentInput {
  opportunity: OpportunityFound;
  agentId: string;
  memoryRootHash?: string;
}

export interface RiskAgentOutput {
  assessment: RiskAssessment;
}

export async function riskAgent(input: RiskAgentInput): Promise<RiskAgentOutput> {
  const { opportunity, agentId } = input;

  const history = await fetchPoolHistory(opportunity.pool);

  // Estimate price ratio from APY volatility as proxy for token divergence
  const priceRatio = history.length >= 2
    ? Math.max(history[history.length - 1]!.apy, 0.01) / Math.max(history[0]!.apy, 0.01)
    : 1.0;

  const impermanentLoss = calculateIL(Math.max(priceRatio, 0.01));

  const result = await chatCompletion({
    messages: [
      {
        role: "system",
        content: "You are a DeFi risk analyst. Evaluate the opportunity and return a JSON object with: riskScore (1-10), contractRisk (low/medium/high), liquidityRisk (low/medium/high), correlationWithPortfolio (-1 to 1), reasoning (string explaining your assessment). Consider: TVL stability, protocol reputation, impermanent loss, historical APY consistency.",
      },
      {
        role: "user",
        content: JSON.stringify({
          opportunity,
          historicalData: history,
          calculatedIL: impermanentLoss,
        }),
      },
    ],
    temperature: 0,
    maxTokens: 1024,
    responseFormat: { type: "json_object" },
  });

  const parsed = result as {
    riskScore: number;
    contractRisk: "low" | "medium" | "high";
    liquidityRisk: "low" | "medium" | "high";
    correlationWithPortfolio: number;
    reasoning: string;
  };

  return {
    assessment: {
      opportunityId: opportunity.id,
      riskScore: parsed.riskScore,
      impermanentLoss,
      contractRisk: parsed.contractRisk,
      liquidityRisk: parsed.liquidityRisk,
      correlationWithPortfolio: parsed.correlationWithPortfolio,
      reasoning: parsed.reasoning,
      agentId,
    },
  };
}
