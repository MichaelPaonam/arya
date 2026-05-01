import type { AgentMemoryBlob } from "../types/index.js";
import { uploadMemory, downloadMemory } from "../tools/og-storage.js";
import { redisClient } from "./redis.js";

export async function saveAgentMemory(memory: AgentMemoryBlob): Promise<string> {
  const rootHash = await uploadMemory(memory);

  const key = `arya:agent:${memory.agentId}:memory`;
  await redisClient.set(`${key}:latest`, rootHash);
  await redisClient.lpush(`${key}:history`, rootHash);

  return rootHash;
}

export async function loadAgentMemory(agentId: string): Promise<AgentMemoryBlob | null> {
  const rootHash = await redisClient.get(`arya:agent:${agentId}:memory:latest`);
  if (!rootHash) return null;

  return downloadMemory(rootHash);
}
