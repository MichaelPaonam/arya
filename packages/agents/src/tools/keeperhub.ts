import { z } from "zod";

const KEEPERHUB_BASE = "https://app.keeperhub.com/api";

export interface CreateWorkflowParams {
  name: string;
  poolAddress: string;
  chainId: number;
  alertThreshold: number;
}

export interface Workflow {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export interface PublishResult {
  id: string;
  status: string;
  publishedAt: string;
}

export interface WorkflowStatus {
  id: string;
  status: string;
  lastRun?: string;
  runCount?: number;
}

const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  createdAt: z.string(),
});

const PublishResultSchema = z.object({
  id: z.string(),
  status: z.string(),
  publishedAt: z.string(),
});

const WorkflowStatusSchema = z.object({
  id: z.string(),
  status: z.string(),
  lastRun: z.string().optional(),
  runCount: z.number().optional(),
});

function getApiKey(): string {
  return process.env["KEEPERHUB_API_KEY"] ?? "kh_default";
}

async function keeperhubRequest(method: string, path: string, body?: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(`${KEEPERHUB_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getApiKey(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error(`KeeperHub API error ${response.status}: ${errorBody["error"] ?? response.statusText}`);
  }

  return response.json();
}

export async function createWorkflow(params: CreateWorkflowParams): Promise<Workflow> {
  const json = await keeperhubRequest("POST", "/workflows/create", {
    name: params.name,
    poolAddress: params.poolAddress,
    chainId: params.chainId,
    alertThreshold: params.alertThreshold,
  });

  return WorkflowSchema.parse(json);
}

export async function publishWorkflow(id: string): Promise<PublishResult> {
  const json = await keeperhubRequest("PUT", `/workflows/${id}/go-live`);
  return PublishResultSchema.parse(json);
}

export async function getWorkflowStatus(id: string): Promise<WorkflowStatus> {
  const json = await keeperhubRequest("GET", `/workflows/${id}`);
  return WorkflowStatusSchema.parse(json);
}
