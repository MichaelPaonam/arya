import { runPipeline } from "@arya/agents";
import type { PipelineConfig } from "@arya/agents";
import { mockPipelineState } from "@/mocks/pipeline-state";

const DEFAULT_AGENT_IDS = {
  scout: "agent-scout-001",
  risk: "agent-risk-001",
  orchestrator: "agent-orch-001",
  executor: "agent-exec-001",
};

export async function POST(req: Request) {
  try {
    const { walletAddress, chainId } = await req.json();

    if (!walletAddress) {
      return Response.json({ error: "walletAddress is required" }, { status: 400 });
    }

    // If no LLM key configured, return mock data for demo
    if (!process.env.OPENROUTER_API_KEY) {
      await new Promise((r) => setTimeout(r, 1500));
      return Response.json(mockPipelineState);
    }

    const config: PipelineConfig = {
      agentIds: DEFAULT_AGENT_IDS,
      walletAddress,
      chainId: chainId ?? 16602,
    };

    const result = await runPipeline(config);
    return Response.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Pipeline execution failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
