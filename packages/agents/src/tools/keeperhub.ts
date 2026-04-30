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

export async function createWorkflow(_params: CreateWorkflowParams): Promise<Workflow> {
  throw new Error("Not implemented");
}

export async function publishWorkflow(_id: string): Promise<PublishResult> {
  throw new Error("Not implemented");
}

export async function getWorkflowStatus(_id: string): Promise<WorkflowStatus> {
  throw new Error("Not implemented");
}
