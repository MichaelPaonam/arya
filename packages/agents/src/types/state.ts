import type { OpportunityFound, RiskAssessment, SwapAction, ExecutionResult } from "./messages.js";
import type { DebateOutcome } from "./debate.js";

export interface StrategyProposal {
  id: string;
  opportunity: OpportunityFound;
  risk: RiskAssessment;
  debateOutcome: DebateOutcome;
  actions: SwapAction[];
  estimatedGas: bigint;
  estimatedReturn: number;
  explanation: string;
  expiresAt: number;
}

export interface PipelineState {
  opportunities: OpportunityFound[];
  riskAssessments: RiskAssessment[];
  debateOutcomes: DebateOutcome[];
  proposals: StrategyProposal[];
  executionResults: ExecutionResult[];
  currentPhase: "scout" | "risk" | "debate" | "orchestrate" | "execute" | "complete";
  errors: PipelineError[];
  outcomeRecorded?: boolean;
}

export interface PipelineError {
  phase: PipelineState["currentPhase"];
  message: string;
  timestamp: number;
}

export interface AgentMemoryBlob {
  agentId: string;
  agentType: "scout" | "risk" | "executor" | "orchestrator";
  version: number;
  timestamp: number;
  state: {
    discoveredOpportunities?: OpportunityFound[];
    riskAssessments?: RiskAssessment[];
    debateOutcomes?: DebateOutcome[];
    executionHistory?: ExecutionResult[];
    orchestratorState?: Record<string, unknown>;
  };
}
