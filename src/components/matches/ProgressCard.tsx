import { PencilLine } from 'lucide-react';

interface Props {
  loaded: number;
  total: number;
  /** Partidos que todavía se pueden cargar (abiertos y sin predicción). */
  pending?: number;
}

export default function ProgressCard({ loaded, total, pending = 0 }: Props) {
  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;

  return (
    <div className="flex w-full shrink-0 flex-col gap-2 rounded-w3-sm border border-w3-border bg-w3-surface p-4 sm:w-[280px]">
      <div className="flex items-center justify-between">
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
      {pending > 0 && (
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-w3-warn">
          <PencilLine className="h-3.5 w-3.5 shrink-0" />
          {pending} {pending === 1 ? 'partido' : 'partidos'} por cargar
        </div>
      )}
    </div>
  );
}
