import type { AgentMemoryBlob } from "../types/index.js";

export async function uploadMemory(_memory: AgentMemoryBlob): Promise<string> {
  throw new Error("Not implemented");
}

export async function downloadMemory(_rootHash: string): Promise<AgentMemoryBlob> {
  throw new Error("Not implemented");
}
