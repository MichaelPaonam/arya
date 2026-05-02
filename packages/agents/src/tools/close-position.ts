import { encodeFunctionData } from "viem";

const POSITION_MANAGER = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

export interface ClosePositionParams {
  tokenId: string;
  liquidity: string;
  recipient: string;
  deadline: number;
  amount0Min?: string;
  amount1Min?: string;
}

export interface ClosePositionCalldata {
  to: string;
  data: string;
  value: string;
}

const DECREASE_LIQUIDITY_ABI = [
  {
    name: "decreaseLiquidity",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "liquidity", type: "uint128" },
          { name: "amount0Min", type: "uint256" },
          { name: "amount1Min", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      },
    ],
    outputs: [
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" },
    ],
  },
] as const;

const COLLECT_ABI = [
  {
    name: "collect",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "recipient", type: "address" },
          { name: "amount0Max", type: "uint128" },
          { name: "amount1Max", type: "uint128" },
        ],
      },
    ],
    outputs: [
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" },
    ],
  },
] as const;

const MULTICALL_ABI = [
  {
    name: "multicall",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "data", type: "bytes[]" }],
    outputs: [{ name: "results", type: "bytes[]" }],
  },
] as const;

const MAX_UINT128 = BigInt("0xffffffffffffffffffffffffffffffff");

export function buildClosePositionCalldata(params: ClosePositionParams): ClosePositionCalldata {
  const decreaseData = encodeFunctionData({
    abi: DECREASE_LIQUIDITY_ABI,
    functionName: "decreaseLiquidity",
    args: [
      {
        tokenId: BigInt(params.tokenId),
        liquidity: BigInt(params.liquidity),
        amount0Min: BigInt(params.amount0Min ?? "0"),
        amount1Min: BigInt(params.amount1Min ?? "0"),
        deadline: BigInt(params.deadline),
      },
    ],
  });

  const collectData = encodeFunctionData({
    abi: COLLECT_ABI,
    functionName: "collect",
    args: [
      {
        tokenId: BigInt(params.tokenId),
        recipient: params.recipient as `0x${string}`,
        amount0Max: MAX_UINT128,
        amount1Max: MAX_UINT128,
      },
    ],
  });

  const multicallData = encodeFunctionData({
    abi: MULTICALL_ABI,
    functionName: "multicall",
    args: [[decreaseData, collectData]],
  });

  return {
    to: POSITION_MANAGER,
    data: multicallData,
    value: "0",
  };
}
