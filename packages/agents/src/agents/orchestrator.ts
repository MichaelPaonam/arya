import type { OpportunityFound, RiskAssessment, StrategyProposal } from "../types/index.js";
import { selectDebateTier } from "../debate/router.js";
import { runDebate } from "../debate/index.js";
import { getSwapQuote } from "../tools/uniswap.js";
import { uploadMemory } from "../tools/og-storage.js";
import { chatCompletion } from "../utils/llm.js";

const DEFAULT_CONFIDENCE_THRESHOLD = 0.4;
const DEFAULT_MAX_RISK_SCORE = 7;

export interface OrchestratorAgentInput {
  opportunity: OpportunityFound;
  riskAssessment: RiskAssessment;
  agentId: string;
  maxRiskScore?: number;
  minConfidence?: number;
  chainId?: number;
  swapper?: string;
  persistState?: boolean;
}

export interface OrchestratorAgentOutput {
  proposal: StrategyProposal | null;
  rejectionReason: string | null;
}

export async function orchestratorAgent(input: OrchestratorAgentInput): Promise<OrchestratorAgentOutput> {
  const { opportunity, riskAssessment, agentId } = input;
  const maxRisk = input.maxRiskScore ?? DEFAULT_MAX_RISK_SCORE;
  const minConfidence = input.minConfidence ?? DEFAULT_CONFIDENCE_THRESHOLD;

  if (riskAssessment.riskScore > maxRisk) {
    return {
      proposal: null,
      rejectionReason: `Rejected: risk score too high (${riskAssessment.riskScore}/10, threshold ${maxRisk})`,
    };
  }

  const tier = selectDebateTier(opportunity, riskAssessment);

  const debateOutcome = await runDebate({
    opportunity,
    riskAssessment,
    tier,
    riskAgentId: riskAssessment.agentId,
    scoutAgentId: opportunity.agentId,
    orchestratorAgentId: agentId,
  });

  if (debateOutcome.confidenceScore < minConfidence) {
    return {
      proposal: null,
      rejectionReason: `Rejected: low confidence (${debateOutcome.confidenceScore.toFixed(2)}, threshold ${minConfidence})`,
    };
  }

  let quote: { amountOut: string; gasEstimate: string };
  try {
    quote = await getSwapQuote({
      tokenIn: opportunity.tokenPair[0]!,
      tokenOut: opportunity.tokenPair[1]!,
      amount: "1000000000",
      chainId: 1,
      swapper: input.swapper,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      proposal: null,
      rejectionReason: `Rejected: no swap route available for ${opportunity.tokenPair.join("/")} (${detail})`,
    };
  }

  const llmResult = await chatCompletion({
    messages: [
      {
        role: "system",
        content: "You are a DeFi strategy synthesizer. Write a concise explanation of this strategy for a human user. Return JSON with: explanation (string, 1-2 sentences).",
      },
      {
        role: "user",
        content: JSON.stringify({ opportunity, riskAssessment, debateOutcome, quote }),
      },
    ],
    temperature: 0.3,
    maxTokens: 256,
    responseFormat: { type: "json_object" },
  });

  const { explanation } = llmResult as { explanation: string };

  const routerAddress = process.env["UNISWAP_ROUTER_ADDRESS"] ?? "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD";

  const proposal: StrategyProposal = {
    id: `strat-${opportunity.id}`,
    opportunity,
    risk: riskAssessment,
    debateOutcome,
    actions: [
      {
        target: routerAddress,
        value: BigInt(0),
        calldata: "0x",
        minAmountOut: BigInt(quote.amountOut),
      },
    ],
    estimatedGas: BigInt(quote.gasEstimate),
    estimatedReturn: opportunity.estimatedAPY,
    explanation,
    expiresAt: Date.now() + 3600_000,
  };

  if (input.persistState) {
    await uploadMemory({
      agentId,
      agentType: "orchestrator",
      version: 1,
      timestamp: Date.now(),
      state: {
        orchestratorState: { lastProposal: proposal.id },
      },
    });
  }

  return { proposal, rejectionReason: null };
}
