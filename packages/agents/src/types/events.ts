import type { OpportunityFound, RiskAssessment } from "./messages.js";
import type { StrategyProposal, PipelineState } from "./state.js";

export type PipelinePhase = "scout" | "risk" | "orchestrate" | "execute" | "complete";

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
