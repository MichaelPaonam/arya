"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
}: EmptyStateProps) {
  return (
    <div className="glass-elevated relative flex flex-col items-center overflow-hidden px-8 py-12 text-center">
      {/* Atmospheric blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full bg-secondary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 right-1/4 size-48 rounded-full bg-tertiary/8 blur-3xl"
      />

      {/* Icon */}
      <div className="glass relative z-10 mb-5 grid size-16 place-items-center rounded-xl">
        <Icon className="size-7 text-secondary" />
      </div>

      {/* Eyebrow */}
      {eyebrow && (
        <span
          data-testid="eyebrow"
          className="relative z-10 mb-2 text-[11px] font-semibold uppercase tracking-widest text-secondary"
        >
          {eyebrow}
        </span>
      )}

      {/* Title + Description */}
      <h3 className="relative z-10 text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="relative z-10 mt-2 max-w-sm text-sm leading-relaxed text-on-surface-variant">
        {description}
      </p>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div data-testid="actions" className="relative z-10 mt-6 flex flex-col items-center gap-3">
          {primaryAction && (
            primaryAction.href ? (
              <Link
                href={primaryAction.href}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                {primaryAction.label}
                <ArrowRight className="size-4" />
              </Link>
            ) : (
              <button
                onClick={primaryAction.onClick}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                {primaryAction.label}
                <ArrowRight className="size-4" />
              </button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="text-sm font-medium text-on-surface-variant underline-offset-2 hover:text-foreground hover:underline"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                onClick={secondaryAction.onClick}
                className="text-sm font-medium text-on-surface-variant underline-offset-2 hover:text-foreground hover:underline"
              >
                {secondaryAction.label}
              </button>
            )
          )}
        </div>
      )}

      {/* Children slot */}
      {children && <div className="relative z-10 mt-6 w-full">{children}</div>}
    </div>
  );
}
