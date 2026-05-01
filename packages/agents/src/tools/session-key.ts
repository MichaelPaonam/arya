export interface ValidateSessionKeyParams {
  sessionKey: string;
  target: string;
  value: bigint;
}

export interface SessionKeyValidation {
  isValid: boolean;
  remainingBudget?: string;
  reason?: string;
}

export async function validateSessionKey(_params: ValidateSessionKeyParams): Promise<SessionKeyValidation> {
  throw new Error("Not implemented");
}
