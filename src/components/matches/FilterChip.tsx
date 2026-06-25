import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  label: string;
  shortLabel?: string;
  count?: number;
  active: boolean;
  tone?: 'muted' | 'warn';
  icon?: ReactNode;
  onClick: () => void;
  className?: string;
}

/** Chip de filtro tipo toggle (clic en el activo lo apaga). */
export default function FilterChip({
  label,
  shortLabel,
  count,
  active,
  tone,
  icon,
  onClick,
  className = '',
}: Props) {
  const activeClass =
    tone === 'warn'
      ? 'border-w3-warn/25 bg-w3-warn-soft text-w3-warn'
      : 'border-w3-primary-border bg-w3-primary-soft text-w3-primary';

  const countClass = active
    ? tone === 'warn'
      ? 'bg-w3-warn/20 text-w3-warn'
      : 'bg-w3-primary/20 text-w3-primary'
    : tone === 'warn' && count
      ? 'bg-w3-warn-soft text-w3-warn'
      : 'bg-w3-score-box text-w3-text-muted';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={active ? 'Quitar filtro' : undefined}
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-w3-sm border px-3.5 py-2 text-sm font-semibold transition-colors ${className} ${
        active
          ? activeClass
          : 'border-w3-border bg-w3-surface text-w3-text-secondary hover:text-w3-white'
      }`}
    >
      {icon}
      {shortLabel ? (
        <>
          <span className="sm:hidden">{shortLabel}</span>
          <span className="hidden sm:inline">{label}</span>
        </>
      ) : (
        label
      )}
      {count != null && (
        <span
          className={`rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums ${countClass}`}
        >
          {count}
        </span>
      )}
      {active && <X className="h-3.5 w-3.5 shrink-0" />}
    </button>
  );
}
