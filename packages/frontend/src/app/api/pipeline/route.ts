import { mockPipelineState } from "@/mocks/pipeline-state";

const AGENTS_URL = process.env.AGENTS_URL || "http://localhost:3001";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return Response.json({ error: "walletAddress is required" }, { status: 400 });
    }

    try {
      const agentResponse = await fetch(`${AGENTS_URL}/pipeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, chainId: 16602 }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!agentResponse.ok) {
        const err = await agentResponse.json().catch(() => ({}));
        return Response.json(
          { error: (err as { error?: string }).error || "Agent pipeline failed" },
          { status: agentResponse.status }
        );
      }

      const result = await agentResponse.json();
      return Response.json(result);
    } catch (fetchError) {
      // Agents server not running — fall back to mock data
      console.warn(
        `[api/pipeline] Agents server at ${AGENTS_URL} unreachable, returning mock data:`,
        fetchError instanceof Error ? fetchError.message : fetchError
      );
      await new Promise((r) => setTimeout(r, 1500));
      return Response.json(mockPipelineState);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Pipeline execution failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
