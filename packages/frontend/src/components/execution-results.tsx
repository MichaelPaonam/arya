"use client";

import Image from "next/image";
import { ExternalLink, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { ExecutionResult, StrategyProposal } from "@/types/pipeline";

interface ExecutionResultsProps {
  results: ExecutionResult[];
  proposals: StrategyProposal[];
  vaultTxHash?: string | null;
}

const OG_EXPLORER = "https://chainscan-galileo.0g.ai/tx";
const KEEPERHUB_URL = "https://app.keeperhub.xyz/workflows";

function StatusBadge({ status }: { status: ExecutionResult["status"] }) {
  switch (status) {
    case "executed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-tertiary/15 px-2.5 py-0.5 text-xs font-semibold text-tertiary">
          <CheckCircle2 className="size-3" /> Executed
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-semibold text-destructive">
          <XCircle className="size-3" /> Failed
        </span>
      );
    case "expired":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning">
          <Clock className="size-3" /> Expired
        </span>
      );
    default:
      return null;
  }
}

function truncateHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

export function ExecutionResults({ results, proposals, vaultTxHash }: ExecutionResultsProps) {
  if (results.length === 0) return null;

  return (
    <div className="glass overflow-hidden">
      <div className="border-b border-white/5 px-5 py-3">
        <h3 className="text-sm font-semibold text-on-surface">Execution Results</h3>
      </div>
      {vaultTxHash && (
        <div className="border-b border-border/50 px-5 py-2.5">
          <a
            href={`${OG_EXPLORER}/${vaultTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-semibold text-secondary transition hover:bg-secondary/20"
          >
            <CheckCircle2 className="size-3" />
            On-chain approval
            <span className="font-mono">{truncateHash(vaultTxHash)}</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      )}
      <div className="divide-y divide-border/50">
        {results.map((result) => {
          const proposal = proposals.find((p) => p.id === result.strategyId);
          const tokenPair = proposal?.opportunity.tokenPair.join("/") ?? result.strategyId;
          const apy = proposal?.estimatedReturn;

          return (
            <div key={result.strategyId} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <div className="flex-1 min-w-[120px]">
                <div className="text-sm font-semibold text-on-surface">{tokenPair}</div>
                {apy != null && (
                  <div className="text-xs text-on-surface-variant">{apy.toFixed(2)}% APY</div>
                )}
              </div>

              <StatusBadge status={result.status} />

              {result.txHash && (
                <a
                  href={`${OG_EXPLORER}/${result.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-foreground/5 px-3 py-1.5 text-xs font-medium text-secondary transition hover:bg-foreground/10"
                >
                  <Image src="/uniswap.svg" alt="" width={14} height={14} />
                  <span className="font-mono">{truncateHash(result.txHash)}</span>
                  <ExternalLink className="size-3" />
                </a>
              )}

              {result.keeperWorkflowId && (
                <a
                  href={`${KEEPERHUB_URL}/${result.keeperWorkflowId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-foreground/5 px-3 py-1.5 text-xs font-medium text-on-surface-variant transition hover:bg-foreground/10"
                >
                  <Image src="/kh.png" alt="" width={14} height={14} />
                  KeeperHub
                  <ExternalLink className="size-3" />
                </a>
              )}

              {result.error && (
                <div className="w-full text-xs text-destructive mt-1">{result.error}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
