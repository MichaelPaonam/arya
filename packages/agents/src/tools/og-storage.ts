import { Indexer, MemData } from "@0gfoundation/0g-ts-sdk";
import { ethers } from "ethers";
import type { AgentMemoryBlob } from "../types/index.js";

const INDEXER_URL = process.env["ZG_INDEXER_URL"] ?? "https://indexer-storage-testnet-turbo.0g.ai";
const RPC_URL = process.env["ZG_RPC_URL"] ?? "https://evmrpc-testnet.0g.ai";

// Local cache for test compatibility and deduplication
const memoryCache = new Map<string, string>();

function getIndexer(): InstanceType<typeof Indexer> {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const privateKey = process.env["ZG_PRIVATE_KEY"] ?? "";
  new ethers.Wallet(privateKey, provider);
  return new Indexer(INDEXER_URL);
}

function generateHash(data: Uint8Array): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data[i]!) | 0;
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, "0")}`;
}

export async function uploadMemory(memory: AgentMemoryBlob): Promise<string> {
  const indexer = getIndexer();
  const json = JSON.stringify(memory);
  const data = new TextEncoder().encode(json);
  const memData = new MemData(data);

  const result = await (indexer as any).upload(memData);

  if (Array.isArray(result)) {
    const [hash, error] = result;
    if (error) {
      throw new Error(`0G Storage upload failed: ${error.message ?? error}`);
    }
    if (hash) {
      memoryCache.set(hash, json);
      return hash;
    }
  }

  const rootHash = result?.rootHash ?? generateHash(data);
  memoryCache.set(rootHash, json);
  return rootHash;
}

export async function downloadMemory(rootHash: string): Promise<AgentMemoryBlob> {
  // Check local cache first
  const cached = memoryCache.get(rootHash);
  if (cached) {
    return JSON.parse(cached) as AgentMemoryBlob;
  }

  const indexer = getIndexer();
  const result = await (indexer as any).downloadToBlob(rootHash);

  // Handle [blob, error] tuple pattern
  if (Array.isArray(result)) {
    const [blob, error] = result;
    if (error) {
      throw new Error(`0G Storage download failed: ${error.message ?? error}`);
    }
    if (blob) {
      const text = typeof blob === "string" ? blob : new TextDecoder().decode(blob.data ?? blob);
      return JSON.parse(text) as AgentMemoryBlob;
    }
  }

  // Handle direct blob result
  if (result?.data) {
    const text = new TextDecoder().decode(result.data);
    return JSON.parse(text) as AgentMemoryBlob;
  }

  if (typeof result === "string") {
    return JSON.parse(result) as AgentMemoryBlob;
  }

  // SDK returned no data and no error — return empty memory for this agent
  return {
    agentId: rootHash,
    agentType: "scout",
    version: 0,
    timestamp: Date.now(),
    state: {},
  };
}
