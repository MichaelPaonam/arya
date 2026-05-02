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

const ALLOWED_TARGETS = new Set([
  "0xC36442b4a4522E871399CD717aBDD847Ab11FE88".toLowerCase(), // Uniswap V3 NonfungiblePositionManager
  "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45".toLowerCase(), // Uniswap V3 SwapRouter02
]);

const MAX_VALUE = 0n;

const SESSION_EXPIRY_HOURS = 24;

export async function validateSessionKey(params: ValidateSessionKeyParams): Promise<SessionKeyValidation> {
  if (!ALLOWED_TARGETS.has(params.target.toLowerCase())) {
    return {
      isValid: false,
      reason: `target ${params.target} is not in allowed targets`,
    };
  }

  if (params.value > MAX_VALUE) {
    return {
      isValid: false,
      reason: `value ${params.value} exceeds max allowed value of ${MAX_VALUE}`,
    };
  }

  const expiresAt = Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000;

  return {
    isValid: true,
    remainingBudget: `Expires at ${new Date(expiresAt).toISOString()}`,
  };
}
