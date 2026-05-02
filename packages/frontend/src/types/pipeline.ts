export interface OpportunityFound {
  id: string;
  protocol: string;
  pool: string;
  tokenPair: [string, string];
  estimatedAPY: number;
  tvl: number;
  category: string;
  source: "defi-llama" | "uniswap-api" | "on-chain";
  reasoning: string;
  discoveredAt: number;
  agentId: string;
}

export interface RiskAssessment {
  opportunityId: string;
  riskScore: number;
  impermanentLoss: number;
  contractRisk: "low" | "medium" | "high";
  liquidityRisk: "low" | "medium" | "high";
  correlationWithPortfolio: number;
  reasoning: string;
  agentId: string;
}

export interface DebateOutcome {
  strategyId: string;
  tier: "fast" | "standard" | "deep";
  challengesRaised: number;
  challengesSurvived: number;
  confidenceScore: number;
  latencyMs: number;
  debateLog: unknown[];
}

export interface SwapAction {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut: string;
  protocol: string;
}

export interface StrategyProposal {
  id: string;
  opportunity: OpportunityFound;
  risk: RiskAssessment;
  debateOutcome: DebateOutcome;
  actions: SwapAction[];
  estimatedGas: string;
  estimatedReturn: number;
  explanation: string;
  expiresAt: number;
}

export interface ExecutionResult {
  strategyId: string;
  status: "executed" | "failed" | "expired" | "pending_approval";
  txHash?: string;
  keeperWorkflowId?: string;
  actualGas?: string;
  error?: string;
}

export interface PipelineError {
  phase: PipelinePhase;
  message: string;
  timestamp: number;
}

export type PipelinePhase = "scout" | "risk" | "debate" | "orchestrate" | "execute" | "complete";

export interface PipelineState {
  opportunities: OpportunityFound[];
  riskAssessments: RiskAssessment[];
  debateOutcomes: DebateOutcome[];
  proposals: StrategyProposal[];
  executionResults: ExecutionResult[];
  currentPhase: PipelinePhase;
  errors: PipelineError[];
}

export type ApiService = "defillama" | "uniswap" | "0g-storage" | "keeperhub" | "on-chain" | "llm";

export type PipelineEvent =
  | { type: "phase"; phase: PipelinePhase; message: string }
  | { type: "opportunity"; data: OpportunityFound }
  | { type: "risk"; data: RiskAssessment }
  | { type: "proposal"; data: StrategyProposal }
  | { type: "rejection"; opportunityId: string; reason: string }
  | { type: "api_call"; service: ApiService; action: string; status: "started" | "success" | "failed"; detail?: string }
  | { type: "storage_receipt"; rootHash: string; txHash: string; fileSize: number }
  | { type: "awaiting_approval"; proposals: StrategyProposal[] }
  | { type: "error"; phase: PipelinePhase; message: string }
  | { type: "complete"; state: PipelineState };
