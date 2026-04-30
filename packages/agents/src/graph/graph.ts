import type { PipelineState } from "../types/index.js";

export interface OutcomeInput {
  success: boolean;
  actualReturn: number; // basis points
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

export function buildPipelineGraph(): { nodes: string[] } {
  throw new Error("Not implemented");
}

export async function runPipeline(_config: PipelineConfig): Promise<PipelineState> {
  throw new Error("Not implemented");
}
