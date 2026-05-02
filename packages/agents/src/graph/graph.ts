import type { PipelineState, OpportunityFound, PipelineEvent } from "../types/index.js";
import { scoutAgent } from "../agents/scout.js";
import { riskAgent } from "../agents/risk.js";
import { orchestratorAgent } from "../agents/orchestrator.js";
import { executorAgent } from "../agents/executor.js";
import { saveAgentMemory, loadAgentMemory } from "../storage/memory.js";
import { recordOutcome } from "../tools/on-chain.js";
import { setGlobalLlmConfig } from "../utils/llm.js";
import type { LlmConfig } from "../utils/llm.js";

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
  maxRiskScore?: number;
  minConfidence?: number;
  poolFilter?: "all" | "stable" | "bluechip";
  stopBeforeExecute?: boolean;
  llm?: LlmConfig;
  outcome?: OutcomeInput;
  onEvent?: (event: PipelineEvent) => void;
}

const PIPELINE_NODES = ["scout", "risk", "debate", "orchestrate", "execute"] as const;

export function buildPipelineGraph(): { nodes: string[] } {
  return { nodes: [...PIPELINE_NODES] };
}

export async function runPipeline(config: PipelineConfig): Promise<PipelineState> {
  const emit = config.onEvent ?? (() => {});

  if (config.llm) {
    setGlobalLlmConfig(config.llm);
  }

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

  // Phase 1: Scout
  state.currentPhase = "scout";
  emit({ type: "phase", phase: "scout", message: "Scanning DeFi pools..." });

  // Load previous memory (non-fatal if fails)
  let memoryRootHash: string | undefined;
  try {
    emit({ type: "api_call", service: "0g-storage", action: "Loading agent memory", status: "started" });
    const memory = await loadAgentMemory(config.agentIds.scout);
    if (memory) {
      memoryRootHash = undefined;
      emit({ type: "api_call", service: "0g-storage", action: "Loading agent memory", status: "success" });
    } else {
      emit({ type: "api_call", service: "0g-storage", action: "Loading agent memory", status: "success", detail: "No prior memory found" });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emit({ type: "api_call", service: "0g-storage", action: "Loading agent memory", status: "failed", detail: msg });
    state.errors.push({ phase: "scout", message: msg, timestamp: Date.now() });
  }

  try {
    emit({ type: "api_call", service: "defillama", action: "Fetching top DeFi pools", status: "started" });
    emit({ type: "api_call", service: "llm", action: "Analyzing pool opportunities", status: "started" });
    const scoutResult = await scoutAgent({
      agentId: config.agentIds.scout,
      memoryRootHash,
      poolFilter: config.poolFilter,
    });
    emit({ type: "api_call", service: "defillama", action: "Fetching top DeFi pools", status: "success" });
    emit({ type: "api_call", service: "llm", action: "Analyzing pool opportunities", status: "success" });
    state.opportunities = scoutResult.opportunities;
    for (const opp of scoutResult.opportunities) {
      emit({ type: "opportunity", data: opp });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emit({ type: "api_call", service: "defillama", action: "Fetching top DeFi pools", status: "failed", detail: msg });
    emit({ type: "error", phase: "scout", message: msg });
    state.errors.push({ phase: "scout", message: msg, timestamp: Date.now() });
    state.currentPhase = "complete";
    emit({ type: "complete", state });
    return state;
  }

  if (state.opportunities.length === 0) {
    state.currentPhase = "complete";
    emit({ type: "complete", state });
    return state;
  }

  // Phase 2: Risk assessment (per opportunity, errors are non-fatal per item)
  state.currentPhase = "risk";
  emit({ type: "phase", phase: "risk", message: `Assessing ${state.opportunities.length} opportunities...` });
  const assessedOpportunities: OpportunityFound[] = [];

  for (const opportunity of state.opportunities) {
    try {
      emit({ type: "api_call", service: "llm", action: `Scoring risk for ${opportunity.pool}`, status: "started" });
      const riskResult = await riskAgent({
        opportunity,
        agentId: config.agentIds.risk,
      });
      emit({ type: "api_call", service: "llm", action: `Scoring risk for ${opportunity.pool}`, status: "success" });
      state.riskAssessments.push(riskResult.assessment);
      assessedOpportunities.push(opportunity);
      emit({ type: "risk", data: riskResult.assessment });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      emit({ type: "api_call", service: "llm", action: `Scoring risk for ${opportunity.pool}`, status: "failed", detail: msg });
      emit({ type: "error", phase: "risk", message: msg });
      state.errors.push({ phase: "risk", message: msg, timestamp: Date.now() });
    }
  }

  if (state.riskAssessments.length === 0) {
    state.currentPhase = "complete";
    emit({ type: "complete", state });
    return state;
  }

  // Persist only successfully assessed opportunities to scout memory
  try {
    emit({ type: "api_call", service: "0g-storage", action: "Persisting scout memory", status: "started" });
    const receipt = await saveAgentMemory({
      agentId: config.agentIds.scout,
      agentType: "scout",
      version: 1,
      timestamp: Date.now(),
      state: {
        discoveredOpportunities: assessedOpportunities,
      },
    });
    emit({ type: "api_call", service: "0g-storage", action: "Persisting scout memory", status: "success", detail: `root: ${receipt.rootHash.slice(0, 10)}...` });
    emit({ type: "storage_receipt", rootHash: receipt.rootHash, txHash: receipt.txHash, fileSize: receipt.fileSize });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emit({ type: "api_call", service: "0g-storage", action: "Persisting scout memory", status: "failed", detail: msg });
  }

  // Phase 3: Orchestrator (debate + proposal generation)
  state.currentPhase = "orchestrate";
  emit({ type: "phase", phase: "orchestrate", message: `Debating ${state.riskAssessments.length} strategies...` });
  for (let i = 0; i < state.riskAssessments.length; i++) {
    const assessment = state.riskAssessments[i]!;
    const opportunity = assessedOpportunities[i]!;

    try {
      emit({ type: "api_call", service: "uniswap", action: `Getting swap quote for ${opportunity.tokenPair.join("/")}`, status: "started" });
      const orchResult = await orchestratorAgent({
        opportunity,
        riskAssessment: assessment,
        agentId: config.agentIds.orchestrator,
        maxRiskScore: config.maxRiskScore,
        minConfidence: config.minConfidence,
        chainId: config.chainId,
        swapper: config.walletAddress,
      });

      if (orchResult.proposal) {
        emit({ type: "api_call", service: "uniswap", action: `Getting swap quote for ${opportunity.tokenPair.join("/")}`, status: "success" });
        state.proposals.push(orchResult.proposal);
        emit({ type: "proposal", data: orchResult.proposal });
      } else {
        const reason = orchResult.rejectionReason ?? "Unknown rejection";
        if (reason.includes("no swap route")) {
          emit({ type: "api_call", service: "uniswap", action: `Getting swap quote for ${opportunity.tokenPair.join("/")}`, status: "failed", detail: reason });
        } else {
          emit({ type: "api_call", service: "uniswap", action: `Getting swap quote for ${opportunity.tokenPair.join("/")}`, status: "success" });
        }
        emit({ type: "rejection", opportunityId: opportunity.id, reason });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      emit({ type: "api_call", service: "uniswap", action: `Getting swap quote for ${opportunity.tokenPair.join("/")}`, status: "failed", detail: msg });
      emit({ type: "error", phase: "orchestrate", message: msg });
      state.errors.push({ phase: "orchestrate", message: msg, timestamp: Date.now() });
    }
  }

  if (state.proposals.length === 0) {
    state.currentPhase = "complete";
    emit({ type: "complete", state });
    return state;
  }

  // Approval gate: stop before executor if configured (default: stop)
  if (config.stopBeforeExecute !== false) {
    emit({ type: "awaiting_approval", proposals: state.proposals });
    state.currentPhase = "complete";
    emit({ type: "complete", state });
    return state;
  }

  // Phase 4: Executor
  state.currentPhase = "execute";
  emit({ type: "phase", phase: "execute", message: `Executing ${state.proposals.length} strategies...` });
  for (const proposal of state.proposals) {
    try {
      emit({ type: "api_call", service: "uniswap", action: "Checking token approval", status: "started" });
      emit({ type: "api_call", service: "keeperhub", action: "Instantiating workflow from template", status: "started" });
      const execResult = await executorAgent({
        proposal,
        walletAddress: config.walletAddress,
        chainId: config.chainId,
      });
      emit({ type: "api_call", service: "uniswap", action: "Checking token approval", status: "success" });
      emit({ type: "api_call", service: "keeperhub", action: "Instantiating workflow from template", status: "success" });
      state.executionResults.push(execResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      emit({ type: "api_call", service: "uniswap", action: "Building swap calldata", status: "failed", detail: msg });
      emit({ type: "error", phase: "execute", message: msg });
      state.errors.push({ phase: "execute", message: msg, timestamp: Date.now() });
    }
  }

  // Phase 5: Outcome recording
  if (config.outcome) {
    const successfulExecution = state.executionResults.find((r) => r.status === "executed");

    if (successfulExecution) {
      try {
        emit({ type: "api_call", service: "on-chain", action: "Recording outcome", status: "started" });
        await recordOutcome({
          strategyId: successfulExecution.strategyId,
          success: config.outcome.success,
          actualReturn: config.outcome.actualReturn,
          chainId: config.chainId,
        });
        state.outcomeRecorded = true;
        emit({ type: "api_call", service: "on-chain", action: "Recording outcome", status: "success" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        emit({ type: "api_call", service: "on-chain", action: "Recording outcome", status: "failed", detail: msg });
        state.errors.push({ phase: "execute", message: msg, timestamp: Date.now() });
      }
    }
  }

  state.currentPhase = "complete";
  emit({ type: "complete", state });
  return state;
}
