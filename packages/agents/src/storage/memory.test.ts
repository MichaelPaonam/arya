import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveAgentMemory, loadAgentMemory } from "./memory.js";
import type { AgentMemoryBlob } from "../types/index.js";

vi.mock("../tools/og-storage.js", () => ({
  uploadMemory: vi.fn(),
  downloadMemory: vi.fn(),
}));

vi.mock("./redis.js", () => ({
  redisClient: {
    set: vi.fn(),
    get: vi.fn(),
    lpush: vi.fn(),
  },
}));

describe("Agent Memory Persistence", () => {
  const mockMemory: AgentMemoryBlob = {
    agentId: "scout-1",
    agentType: "scout",
    version: 3,
    timestamp: Date.now(),
    state: {
      discoveredOpportunities: [
        {
          id: "opp-1",
          protocol: "uniswap-v3",
          pool: "0xpool",
          tokenPair: ["USDC", "ETH"] as [string, string],
          estimatedAPY: 12.5,
          tvl: 50_000_000,
          category: "liquidity_provision",
          source: "defi-llama" as const,
          reasoning: "test",
          discoveredAt: Date.now(),
          agentId: "scout-1",
        },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveAgentMemory", () => {
    it("should upload to 0G and store rootHash in Redis", async () => {
      const { uploadMemory } = await import("../tools/og-storage.js");
      vi.mocked(uploadMemory).mockResolvedValue("0xabc123");

      const { redisClient } = await import("./redis.js");

      const rootHash = await saveAgentMemory(mockMemory);

      expect(rootHash).toBe("0xabc123");
      expect(uploadMemory).toHaveBeenCalledWith(mockMemory);
      expect(redisClient.set).toHaveBeenCalledWith(
        "arya:agent:scout-1:memory:latest",
        "0xabc123"
      );
      expect(redisClient.lpush).toHaveBeenCalledWith(
        "arya:agent:scout-1:memory:history",
        "0xabc123"
      );
    });

    it("should increment version on save", async () => {
      const { uploadMemory } = await import("../tools/og-storage.js");
      vi.mocked(uploadMemory).mockResolvedValue("0xdef456");

      await saveAgentMemory(mockMemory);

      expect(uploadMemory).toHaveBeenCalledWith(
        expect.objectContaining({ version: 3 })
      );
    });

    it("should handle upload failure", async () => {
      const { uploadMemory } = await import("../tools/og-storage.js");
      vi.mocked(uploadMemory).mockRejectedValue(new Error("0G upload failed"));

      await expect(saveAgentMemory(mockMemory)).rejects.toThrow("0G upload failed");
    });
  });

  describe("loadAgentMemory", () => {
    it("should read rootHash from Redis and download from 0G", async () => {
      const { redisClient } = await import("./redis.js");
      vi.mocked(redisClient.get).mockResolvedValue("0xabc123");

      const { downloadMemory } = await import("../tools/og-storage.js");
      vi.mocked(downloadMemory).mockResolvedValue(mockMemory);

      const memory = await loadAgentMemory("scout-1");

      expect(redisClient.get).toHaveBeenCalledWith("arya:agent:scout-1:memory:latest");
      expect(downloadMemory).toHaveBeenCalledWith("0xabc123");
      expect(memory).toEqual(mockMemory);
    });

    it("should return null if no memory exists", async () => {
      const { redisClient } = await import("./redis.js");
      vi.mocked(redisClient.get).mockResolvedValue(null);

      const memory = await loadAgentMemory("new-agent");

      expect(memory).toBeNull();
    });

    it("should handle 0G download failure", async () => {
      const { redisClient } = await import("./redis.js");
      vi.mocked(redisClient.get).mockResolvedValue("0xbroken");

      const { downloadMemory } = await import("../tools/og-storage.js");
      vi.mocked(downloadMemory).mockRejectedValue(new Error("Download failed"));

      await expect(loadAgentMemory("scout-1")).rejects.toThrow("Download failed");
    });
  });
});
