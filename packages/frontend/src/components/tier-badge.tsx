"use client";

const tierStyles: Record<string, string> = {
  bronze:
    "bg-[oklch(0.65_0.14_55/0.18)] text-[oklch(0.45_0.14_55)] dark:text-[oklch(0.85_0.13_75)]",
  silver:
    "bg-[oklch(0.65_0.02_240/0.18)] text-[oklch(0.40_0.03_240)] dark:text-[oklch(0.92_0.02_240)]",
  gold:
    "bg-[oklch(0.75_0.16_85/0.18)] text-[oklch(0.50_0.14_75)] dark:text-[oklch(0.88_0.15_85)]",
  platinum: "bg-secondary/15 text-secondary",
};

export function TierBadge({ tier }: { tier: string }) {
  const style = tierStyles[tier] || tierStyles.bronze;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style}`}
    >
      {tier}
    </span>
  );
}
