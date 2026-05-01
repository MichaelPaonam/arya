import { mockPipelineState } from "@/mocks/pipeline-state";

export async function POST(req: Request) {
  try {
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return Response.json({ error: "walletAddress is required" }, { status: 400 });
    }

    // When OPENROUTER_API_KEY is set and @arya/agents is available,
    // this route calls runPipeline(). For now, return mock data
    // with a simulated delay to demonstrate the UI flow.
    //
    // Real integration requires running the agents package as a
    // separate serverless function (avoids webpack bundling issues
    // with Node.js-only dependencies like Redis/0G SDK).

    await new Promise((r) => setTimeout(r, 2000));
    return Response.json(mockPipelineState);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Pipeline execution failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
