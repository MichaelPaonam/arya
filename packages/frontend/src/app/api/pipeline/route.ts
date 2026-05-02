import { runPipeline } from "@arya/agents";
import type { PipelineConfig, PipelineEvent, LlmConfig } from "@arya/agents";
import { mockPipelineState } from "@/mocks/pipeline-state";

const DEFAULT_AGENT_IDS = {
  scout: "agent-scout-001",
  risk: "agent-risk-001",
  orchestrator: "agent-orch-001",
  executor: "agent-exec-001",
};

export async function POST(req: Request) {
  try {
    const { walletAddress, chainId, maxRiskScore, minConfidence, poolFilter, poolLimit, llmProvider, llmApiKey, llmModel, llmBaseUrl } = await req.json();

    if (!walletAddress) {
      return Response.json({ error: "walletAddress is required" }, { status: 400 });
    }

    // If no LLM key configured (neither user-provided nor server-side), return mock SSE stream
    if (!llmApiKey && !process.env.OPENROUTER_API_KEY) {
      return streamMockEvents();
    }

    // Build LLM config from user-provided settings or fall back to server env
    let llm: LlmConfig | undefined;
    if (llmApiKey && llmProvider) {
      llm = {
        provider: llmProvider as "anthropic" | "openrouter",
        apiKey: llmApiKey,
        model: llmModel ?? "claude-haiku-4-5-20251001",
        baseUrl: llmBaseUrl || (llmProvider === "anthropic" ? process.env.ANTHROPIC_URL : undefined),
      };
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event: PipelineEvent) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event, (_key, value) => typeof value === "bigint" ? value.toString() : value)}\n\n`));
        };

        const config: PipelineConfig = {
          agentIds: DEFAULT_AGENT_IDS,
          walletAddress,
          chainId: chainId ?? 16602,
          maxRiskScore: maxRiskScore ?? undefined,
          minConfidence: minConfidence ?? undefined,
          poolFilter: poolFilter ?? undefined,
          poolLimit: poolLimit ?? undefined,
          llm,
          onEvent: emit,
        };

        await runPipeline(config);
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Pipeline execution failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

function streamMockEvents(): Response {
  const encoder = new TextEncoder();
  const state = mockPipelineState;

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      emit({ type: "phase", phase: "scout", message: "Scanning DeFi pools..." });
      await delay(800);
      emit({ type: "api_call", service: "defillama", action: "Fetching top DeFi pools", status: "started" });
      await delay(600);
      emit({ type: "api_call", service: "defillama", action: "Fetching top DeFi pools", status: "success" });
      emit({ type: "api_call", service: "llm", action: "Analyzing pool opportunities", status: "started" });
      await delay(1000);
      emit({ type: "api_call", service: "llm", action: "Analyzing pool opportunities", status: "success" });

      for (const opp of state.opportunities) {
        emit({ type: "opportunity", data: opp });
        await delay(200);
      }

      emit({ type: "phase", phase: "risk", message: `Assessing ${state.opportunities.length} opportunities...` });
      await delay(500);

      for (const assessment of state.riskAssessments) {
        emit({ type: "api_call", service: "llm", action: `Scoring risk for ${assessment.opportunityId}`, status: "started" });
        await delay(800);
        emit({ type: "api_call", service: "llm", action: `Scoring risk for ${assessment.opportunityId}`, status: "success" });
        emit({ type: "risk", data: assessment });
        await delay(200);
      }

      emit({ type: "api_call", service: "0g-storage", action: "Persisting scout memory", status: "started" });
      await delay(400);
      emit({ type: "api_call", service: "0g-storage", action: "Persisting scout memory", status: "success" });
      emit({ type: "storage_receipt", rootHash: "0x8a3f2b1c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a", txHash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b", fileSize: 4821 });

      emit({ type: "phase", phase: "orchestrate", message: "Debating strategies..." });
      await delay(500);

      for (const proposal of state.proposals) {
        emit({ type: "api_call", service: "uniswap", action: `Getting swap quote for ${proposal.opportunity.tokenPair.join("/")}`, status: "started" });
        await delay(600);
        emit({ type: "api_call", service: "uniswap", action: `Getting swap quote for ${proposal.opportunity.tokenPair.join("/")}`, status: "success" });
        emit({ type: "proposal", data: proposal });
        await delay(200);
      }

      emit({ type: "awaiting_approval", proposals: state.proposals });
      emit({ type: "complete", state });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
