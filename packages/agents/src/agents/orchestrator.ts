import type { OpportunityFound, RiskAssessment, StrategyProposal } from "../types/index.js";

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

export async function orchestratorAgent(_input: OrchestratorAgentInput): Promise<OrchestratorAgentOutput> {
  throw new Error("Not implemented");
}
