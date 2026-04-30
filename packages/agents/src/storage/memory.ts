import type { AgentMemoryBlob } from "../types/index.js";

export async function saveAgentMemory(_memory: AgentMemoryBlob): Promise<string> {
  throw new Error("Not implemented");
}

export async function loadAgentMemory(_agentId: string): Promise<AgentMemoryBlob | null> {
  throw new Error("Not implemented");
}
