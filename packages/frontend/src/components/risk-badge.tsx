"use client";

export function RiskBadge({ level }: { level: "low" | "medium" | "high" }) {
  const map = {
    low: "bg-tertiary/15 text-tertiary",
    medium: "bg-warning/15 text-warning",
    high: "bg-destructive/15 text-destructive",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${map[level]}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {level}
    </span>
  );
}
