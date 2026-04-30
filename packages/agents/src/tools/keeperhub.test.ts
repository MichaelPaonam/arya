import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { createWorkflow, publishWorkflow, getWorkflowStatus } from "./keeperhub.js";

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const KEEPERHUB_BASE = "https://app.keeperhub.com/api";

describe("KeeperHub Tool", () => {
  describe("createWorkflow", () => {
    it("should create a monitoring workflow and return its ID", async () => {
      server.use(
        http.post(`${KEEPERHUB_BASE}/workflows/create`, async ({ request }) => {
          const body = await request.json() as Record<string, unknown>;
          expect(body["name"]).toContain("ARYA");
          return HttpResponse.json({
            id: "wf_abc123",
            name: body["name"],
            status: "draft",
            createdAt: "2026-04-30T10:00:00Z",
          });
        })
      );

      const workflow = await createWorkflow({
        name: "ARYA-Monitor-USDC-ETH",
        poolAddress: "0x1234567890abcdef1234567890abcdef12345678",
        chainId: 16602,
        alertThreshold: 5.0,
      });

      expect(workflow.id).toBe("wf_abc123");
      expect(workflow.status).toBe("draft");
    });

    it("should include API key in request headers", async () => {
      server.use(
        http.post(`${KEEPERHUB_BASE}/workflows/create`, ({ request }) => {
          const apiKey = request.headers.get("x-api-key");
          expect(apiKey).toMatch(/^kh_/);
          return HttpResponse.json({ id: "wf_test", name: "test", status: "draft", createdAt: "" });
        })
      );

      await createWorkflow({
        name: "ARYA-Test",
        poolAddress: "0x1234",
        chainId: 16602,
        alertThreshold: 5.0,
      });
    });

    it("should handle API errors", async () => {
      server.use(
        http.post(`${KEEPERHUB_BASE}/workflows/create`, () => {
          return HttpResponse.json({ error: "Invalid configuration" }, { status: 400 });
        })
      );

      await expect(
        createWorkflow({
          name: "ARYA-Bad",
          poolAddress: "",
          chainId: 16602,
          alertThreshold: -1,
        })
      ).rejects.toThrow();
    });
  });

  describe("publishWorkflow", () => {
    it("should publish a draft workflow", async () => {
      server.use(
        http.put(`${KEEPERHUB_BASE}/workflows/:id/go-live`, ({ params }) => {
          expect(params["id"]).toBe("wf_abc123");
          return HttpResponse.json({
            id: "wf_abc123",
            status: "live",
            publishedAt: "2026-04-30T10:05:00Z",
          });
        })
      );

      const result = await publishWorkflow("wf_abc123");

      expect(result.status).toBe("live");
      expect(result.publishedAt).toBeDefined();
    });

    it("should handle already-published workflow", async () => {
      server.use(
        http.put(`${KEEPERHUB_BASE}/workflows/:id/go-live`, () => {
          return HttpResponse.json({ error: "Workflow already live" }, { status: 409 });
        })
      );

      await expect(publishWorkflow("wf_already_live")).rejects.toThrow();
    });
  });

  describe("getWorkflowStatus", () => {
    it("should return current workflow status", async () => {
      server.use(
        http.get(`${KEEPERHUB_BASE}/workflows/:id`, ({ params }) => {
          return HttpResponse.json({
            id: params["id"],
            status: "live",
            lastRun: "2026-04-30T10:15:00Z",
            runCount: 42,
          });
        })
      );

      const status = await getWorkflowStatus("wf_abc123");

      expect(status.status).toBe("live");
      expect(status.runCount).toBe(42);
    });
  });
});
