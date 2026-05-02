import { runPipeline } from "@arya/agents";
import type { PipelineConfig, PipelineEvent, LlmConfig } from "@arya/agents";
import { mockPipelineState } from "@/mocks/pipeline-state";
import { createWalletClient, createPublicClient, http, keccak256, toHex, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { STRATEGY_VAULT } from "@/lib/contracts";

const ogTestnet = defineChain({
  id: 16602,
  name: "0G Chain Testnet",
  nativeCurrency: { name: "A0GI", symbol: "A0GI", decimals: 18 },
  rpcUrls: { default: { http: ["https://evmrpc-testnet.0g.ai"] } },
  testnet: true,
});

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
        const proposalIds: string[] = [];
        let proposalsReady: Promise<string[]> | null = null;

        const emit = (event: PipelineEvent) => {
          // Collect proposal IDs as they stream in
          if (event.type === "proposal" && "data" in event) {
            const data = event.data as { id?: string };
            if (data.id) proposalIds.push(data.id);
          }
          // When awaiting_approval fires, kick off on-chain propose (non-blocking for the stream)
          if (event.type === "awaiting_approval" && proposalIds.length > 0 && !proposalsReady) {
            proposalsReady = proposeStrategiesOnChain([...proposalIds]);
          }
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

        // Wait for on-chain propose to finish before closing stream
        if (proposalsReady) await proposalsReady;

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

      emit({ type: "phase", phase: "orchestrate", message: "Debating strategies..." });
      await delay(500);

      for (const proposal of state.proposals) {
        emit({ type: "api_call", service: "uniswap", action: `Getting swap quote for ${proposal.opportunity.tokenPair.join("/")}`, status: "started" });
        await delay(600);
        emit({ type: "api_call", service: "uniswap", action: `Getting swap quote for ${proposal.opportunity.tokenPair.join("/")}`, status: "success" });
        emit({ type: "proposal", data: proposal });
        await delay(200);
      }

      emit({ type: "api_call", service: "0g-storage", action: "Persisting strategy debate + ratings to 0G", status: "started" });
      await delay(400);
      emit({ type: "api_call", service: "0g-storage", action: "Persisting strategy debate + ratings to 0G", status: "success" });
      emit({ type: "storage_receipt", rootHash: "0x8a3f2b1c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a", txHash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b", fileSize: 4821 });

      // Propose strategies on-chain so user only needs to sign approve
      const proposalIds = state.proposals.map((p: { id: string }) => p.id);
      emit({ type: "api_call", service: "0g-chain", action: "Proposing strategies on-chain", status: "started" });
      const proposeTxHashes = await proposeStrategiesOnChain(proposalIds);
      emit({ type: "api_call", service: "0g-chain", action: "Proposing strategies on-chain", status: proposeTxHashes.length > 0 ? "success" : "skipped" });

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

async function proposeStrategiesOnChain(proposalIds: string[]): Promise<string[]> {
  const privateKey = process.env.ORCHESTRATOR_PRIVATE_KEY ?? process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("[Pipeline] No private key found. ORCHESTRATOR_PRIVATE_KEY and DEPLOYER_PRIVATE_KEY are both undefined.");
    return [];
  }
  console.log(`[Pipeline] Proposing ${proposalIds.length} strategies on-chain with key ${privateKey.slice(0, 8)}...`);

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const client = createWalletClient({
    account,
    chain: ogTestnet,
    transport: http("https://evmrpc-testnet.0g.ai"),
  });

  const txHashes: string[] = [];
  for (const id of proposalIds) {
    const strategyId = keccak256(toHex(id));
    const dummyAction = {
      target: "0x0000000000000000000000000000000000000001" as `0x${string}`,
      value: 0n,
      calldata_: "0x" as `0x${string}`,
      minAmountOut: 0n,
    };

    try {
      const hash = await client.writeContract({
        address: STRATEGY_VAULT.address,
        abi: STRATEGY_VAULT.abi,
        functionName: "proposeStrategy",
        args: [strategyId, [dummyAction], 1500n, 3],
        gas: 300_000n,
      });
      txHashes.push(hash);
    } catch (e) {
      console.error(`[Pipeline] proposeStrategy failed for ${id}:`, e);
    }
  }
  return txHashes;
}
