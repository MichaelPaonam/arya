import { Indexer, MemData } from "@0gfoundation/0g-ts-sdk";
import { ethers } from "ethers";
import type { AgentMemoryBlob } from "../types/index.js";
import { SmartAccountSigner } from "../adapters/smart-account-signer.js";

const INDEXER_URL = process.env["ZG_INDEXER_URL"] ?? "https://indexer-storage-testnet-turbo.0g.ai";
const RPC_URL = process.env["ZG_RPC_URL"] ?? "https://evmrpc-testnet.0g.ai";

const memoryCache = new Map<string, string>();

export interface StorageReceipt {
  rootHash: string;
  txHash: string;
  fileSize: number;
}

function getSigner(): ethers.Signer {
  const sessionKey = process.env["SESSION_KEY_PRIVATE_KEY"];
  const smartAccount = process.env["SMART_ACCOUNT_ADDRESS"];

  if (sessionKey && smartAccount) {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(sessionKey, provider);
    return new SmartAccountSigner(wallet, smartAccount, provider);
  }

  const privateKey = process.env["ZG_PRIVATE_KEY"];
  if (!privateKey) {
    throw new Error("No signer configured for 0G Storage — set ZG_PRIVATE_KEY or SESSION_KEY_PRIVATE_KEY + SMART_ACCOUNT_ADDRESS");
  }
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Wallet(privateKey, provider);
}

function getIndexer(): InstanceType<typeof Indexer> {
  return new Indexer(INDEXER_URL);
}

const UPLOAD_TIMEOUT_MS = 30_000;

export async function uploadMemory(memory: AgentMemoryBlob): Promise<StorageReceipt> {
  const indexer = getIndexer();
  const signer = getSigner();
  const json = JSON.stringify(memory);
  const data = new TextEncoder().encode(json);
  const memData = new MemData(data);

  const uploadPromise = indexer.upload(memData, RPC_URL, signer);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("0G Storage upload timed out after 30s")), UPLOAD_TIMEOUT_MS)
  );

  const [result, error] = await Promise.race([uploadPromise, timeoutPromise]);

  if (error) {
    throw new Error(`0G Storage upload failed: ${error.message ?? error}`);
  }

  const rootHash = "rootHash" in result ? result.rootHash : result.rootHashes[0]!;
  const txHash = "txHash" in result ? result.txHash : result.txHashes[0]!;

  memoryCache.set(rootHash, json);

  return {
    rootHash,
    txHash,
    fileSize: data.byteLength,
  };
}

export async function downloadMemory(rootHash: string): Promise<AgentMemoryBlob> {
  const cached = memoryCache.get(rootHash);
  if (cached) {
    return JSON.parse(cached) as AgentMemoryBlob;
  }

  const indexer = getIndexer();
  const [blob, error] = await indexer.downloadToBlob(rootHash);

  if (error) {
    throw new Error(`0G Storage download failed: ${error.message ?? error}`);
  }

  const text = await blob.text();
  memoryCache.set(rootHash, text);
  return JSON.parse(text) as AgentMemoryBlob;
}
