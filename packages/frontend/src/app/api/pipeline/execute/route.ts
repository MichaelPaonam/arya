import { executorAgent } from "@arya/agents";
import type { StrategyProposal, ExecutionResult } from "@arya/agents";

export async function POST(req: Request) {
  try {
    const { proposals, walletAddress, chainId, amounts } = await req.json() as {
      proposals: StrategyProposal[];
      walletAddress: string;
      chainId: number;
      amounts?: Record<string, string>;
    };

    if (!proposals?.length || !walletAddress) {
      return Response.json({ error: "proposals and walletAddress are required" }, { status: 400 });
    }

    const results: ExecutionResult[] = [];
    for (const proposal of proposals) {
      const amount = amounts?.[proposal.id];
      const result = await executorAgent({ proposal, walletAddress, chainId: chainId ?? 16602, amount });
      results.push(result);
    }

    return Response.json({ results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Execution failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
