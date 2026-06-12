interface Props {
  loaded: number;
  total: number;
}

export default function ProgressCard({ loaded, total }: Props) {
  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;

  return (
    <div className="w-full shrink-0 rounded-w3-sm border border-w3-border bg-w3-surface p-4 sm:w-[280px]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-medium text-w3-text-secondary">
          Tu progreso
        </span>
        <span className="flex items-baseline gap-1">
          <span className="font-display text-[15px] font-bold text-w3-primary">
            {loaded}
          </span>
          <span className="text-[13px] font-medium text-w3-text-muted">
            / {total} cargados
          </span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-w3-score-box">
        <div
          className="h-full rounded bg-w3-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
