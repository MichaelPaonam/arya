import type { OpportunityFound, RiskAssessment, StrategyProposal } from "../types/index.js";
import { selectDebateTier } from "../debate/router.js";
import { runDebate } from "../debate/index.js";
import { getSwapQuote } from "../tools/uniswap.js";
import { uploadMemory } from "../tools/og-storage.js";
import { chatCompletion } from "../utils/llm.js";

const CONFIDENCE_THRESHOLD = 0.4;

export interface OrchestratorAgentInput {
  opportunity: OpportunityFound;
  riskAssessment: RiskAssessment;
  agentId: string;
  persistState?: boolean;
}

export interface OrchestratorAgentOutput {
  proposal: StrategyProposal | null;
  rejectionReason: string | null;
}

export async function orchestratorAgent(input: OrchestratorAgentInput): Promise<OrchestratorAgentOutput> {
  const { opportunity, riskAssessment, agentId } = input;

  const tier = selectDebateTier(opportunity, riskAssessment);

  const debateOutcome = await runDebate({
    opportunity,
    riskAssessment,
    tier,
    riskAgentId: riskAssessment.agentId,
    scoutAgentId: opportunity.agentId,
    orchestratorAgentId: agentId,
  });

  if (debateOutcome.confidenceScore < CONFIDENCE_THRESHOLD) {
    return {
      proposal: null,
      rejectionReason: `Rejected: low confidence (${debateOutcome.confidenceScore})`,
    };
  }

  const quote = await getSwapQuote({
    tokenIn: opportunity.tokenPair[0]!,
    tokenOut: opportunity.tokenPair[1]!,
    amount: "1000000000",
    chainId: 1,
  });

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
