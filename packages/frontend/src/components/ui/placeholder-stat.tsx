interface PlaceholderStatProps {
  label: string;
  hint?: string;
}

export function PlaceholderStat({ label, hint }: PlaceholderStatProps) {
  return (
    <div className="glass-stat flex flex-col gap-1 p-4">
      <span className="text-2xl font-bold text-on-surface-variant/40">—</span>
      <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      {hint && (
        <span data-testid="stat-hint" className="text-[10px] text-on-surface-variant/60">
          {hint}
        </span>
      )}
    </div>
  );
}
