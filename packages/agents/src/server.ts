import { createServer } from "node:http";
import { runPipeline } from "./graph/graph.js";
import type { PipelineConfig } from "./graph/graph.js";

const PORT = parseInt(process.env["AGENTS_PORT"] ?? "3001", 10);

const DEFAULT_AGENT_IDS = {
  scout: "agent-scout-001",
  risk: "agent-risk-001",
  orchestrator: "agent-orch-001",
  executor: "agent-exec-001",
};

const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/pipeline") {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }

    try {
      const { walletAddress, chainId } = JSON.parse(body) as {
        walletAddress?: string;
        chainId?: number;
      };

      if (!walletAddress) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "walletAddress is required" }));
        return;
      }

      const config: PipelineConfig = {
        agentIds: DEFAULT_AGENT_IDS,
        walletAddress,
        chainId: chainId ?? 16602,
      };

      console.log(`[agents] Running pipeline for ${walletAddress}...`);
      const result = await runPipeline(config);
      console.log(`[agents] Pipeline complete. Phase: ${result.currentPhase}, Opportunities: ${result.opportunities.length}, Errors: ${result.errors.length}`);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[agents] Pipeline error: ${message}`);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: message }));
    }
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", timestamp: Date.now() }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`[agents] Server listening on http://localhost:${PORT}`);
  console.log(`[agents] POST /pipeline — run the agent swarm`);
  console.log(`[agents] GET  /health   — health check`);

  if (!process.env["OPENROUTER_API_KEY"]) {
    console.warn(`[agents] ⚠ OPENROUTER_API_KEY not set — LLM calls will fail`);
  }
});
