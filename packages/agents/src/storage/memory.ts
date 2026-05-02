import type { AgentMemoryBlob } from "../types/index.js";
import { uploadMemory, downloadMemory } from "../tools/og-storage.js";
import type { StorageReceipt } from "../tools/og-storage.js";
import { redisClient } from "./redis.js";

export type { StorageReceipt };

export async function saveAgentMemory(memory: AgentMemoryBlob): Promise<StorageReceipt> {
  const receipt = await uploadMemory(memory);

  const key = `arya:agent:${memory.agentId}:memory`;
  try {
    await redisClient.set(`${key}:latest`, receipt.rootHash);
    await redisClient.lpush(`${key}:history`, receipt.rootHash);
  } catch {
    // Redis persistence is best-effort — don't fail the pipeline
  }

  return receipt;
}

export async function loadAgentMemory(agentId: string): Promise<AgentMemoryBlob | null> {
  try {
    const rootHash = await redisClient.get(`arya:agent:${agentId}:memory:latest`);
    if (!rootHash) return null;
    return downloadMemory(rootHash);
  } catch {
    return null;
  }
}
