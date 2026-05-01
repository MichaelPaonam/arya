import type { PipelineState, OpportunityFound } from "../types/index.js";
import { scoutAgent } from "../agents/scout.js";
import { riskAgent } from "../agents/risk.js";
import { orchestratorAgent } from "../agents/orchestrator.js";
import { executorAgent } from "../agents/executor.js";
import { saveAgentMemory, loadAgentMemory } from "../storage/memory.js";
import { recordOutcome } from "../tools/on-chain.js";

export interface OutcomeInput {
  success: boolean;
  actualReturn: number;
}

export interface PipelineConfig {
  agentIds: {
    scout: string;
    risk: string;
    orchestrator: string;
    executor: string;
  };
  walletAddress: string;
  chainId: number;
  outcome?: OutcomeInput;
}

const PIPELINE_NODES = ["scout", "risk", "debate", "orchestrate", "execute"] as const;

export function buildPipelineGraph(): { nodes: string[] } {
  return { nodes: [...PIPELINE_NODES] };
}

export async function runPipeline(config: PipelineConfig): Promise<PipelineState> {
  const state: PipelineState = {
    opportunities: [],
    riskAssessments: [],
    debateOutcomes: [],
    proposals: [],
    executionResults: [],
    currentPhase: "scout",
    errors: [],
    outcomeRecorded: false,
  };

  // Load previous memory (non-fatal if fails)
  let memoryRootHash: string | undefined;
  try {
    const memory = await loadAgentMemory(config.agentIds.scout);
    if (memory) {
      memoryRootHash = undefined; // memory loaded inline, pass hash if needed
    }
  } catch (err) {
    state.errors.push({
      phase: "scout",
      message: err instanceof Error ? err.message : String(err),
      timestamp: Date.now(),
    });
  }

  // Phase 1: Scout
  state.currentPhase = "scout";
  try {
    const scoutResult = await scoutAgent({
      agentId: config.agentIds.scout,
      memoryRootHash,
    });
    state.opportunities = scoutResult.opportunities;
  } catch (err) {
    state.errors.push({
      phase: "scout",
      message: err instanceof Error ? err.message : String(err),
      timestamp: Date.now(),
    });
    state.currentPhase = "complete";
    return state;
  }

  if (state.opportunities.length === 0) {
    state.currentPhase = "complete";
    return state;
  }

  // Phase 2: Risk assessment (per opportunity, errors are non-fatal per item)
  state.currentPhase = "risk";
  const assessedOpportunities: OpportunityFound[] = [];

  for (const opportunity of state.opportunities) {
    try {
      const riskResult = await riskAgent({
        opportunity,
        agentId: config.agentIds.risk,
      });
      state.riskAssessments.push(riskResult.assessment);
      assessedOpportunities.push(opportunity);
    } catch (err) {
      state.errors.push({
        phase: "risk",
        message: err instanceof Error ? err.message : String(err),
        timestamp: Date.now(),
      });
    }
  }

  if (state.riskAssessments.length === 0) {
    state.currentPhase = "complete";
    return state;
  }

  // Persist only successfully assessed opportunities to scout memory
  try {
    await saveAgentMemory({
      agentId: config.agentIds.scout,
      agentType: "scout",
      version: 1,
      timestamp: Date.now(),
      state: {
        discoveredOpportunities: assessedOpportunities,
      },
    });
  } catch {
    // Non-fatal: memory persistence failure doesn't block pipeline
  }

  // Phase 3: Orchestrator (debate + proposal generation)
  state.currentPhase = "orchestrate";
  for (let i = 0; i < state.riskAssessments.length; i++) {
    const assessment = state.riskAssessments[i]!;
    const opportunity = assessedOpportunities[i]!;

    try {
      const orchResult = await orchestratorAgent({
        opportunity,
        riskAssessment: assessment,
        agentId: config.agentIds.orchestrator,
      });

      if (orchResult.proposal) {
        state.proposals.push(orchResult.proposal);
      }
    } catch (err) {
      state.errors.push({
        phase: "orchestrate",
        message: err instanceof Error ? err.message : String(err),
        timestamp: Date.now(),
      });
    }
  }

  if (state.proposals.length === 0) {
    state.currentPhase = "complete";
    return state;
  }

  // Phase 4: Executor
  state.currentPhase = "execute";
  for (const proposal of state.proposals) {
    try {
      const execResult = await executorAgent({
        proposal,
        walletAddress: config.walletAddress,
        chainId: config.chainId,
      });
      state.executionResults.push(execResult);
    } catch (err) {
      state.errors.push({
        phase: "execute",
        message: err instanceof Error ? err.message : String(err),
        timestamp: Date.now(),
      });
    }
  }

  // Phase 5: Outcome recording (only for demo, when outcome provided and execution succeeded)
  if (config.outcome) {
    const successfulExecution = state.executionResults.find(
      (r) => r.status === "executed"
    );

    if (successfulExecution) {
      try {
        await recordOutcome({
          strategyId: successfulExecution.strategyId,
          success: config.outcome.success,
          actualReturn: config.outcome.actualReturn,
          chainId: config.chainId,
        });
        state.outcomeRecorded = true;
      } catch (err) {
        state.errors.push({
          phase: "execute",
          message: err instanceof Error ? err.message : String(err),
          timestamp: Date.now(),
        });
      }
    }
  }

  state.currentPhase = "complete";
  return state;
}
