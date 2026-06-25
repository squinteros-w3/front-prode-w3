import { LayoutGrid, Trophy } from 'lucide-react';

export type MatchPhaseTab = 'group' | 'knockout';

interface Props {
  /** null cuando hay una vista unificada activa (ninguna fase resaltada). */
  active: MatchPhaseTab | null;
  onChange: (phase: MatchPhaseTab) => void;
  groupCount: number;
  knockoutCount: number;
}

export default function PhaseTabs({
  active,
  onChange,
  groupCount,
  knockoutCount,
}: Props) {
  return (
    <div className="flex w-full gap-1 rounded-xl border border-w3-border bg-w3-surface p-1 sm:w-fit">
      <PhaseTab
        active={active === 'group'}
        tone="group"
        icon={<LayoutGrid className="h-4 w-4" />}
        label="Fase de grupos"
        count={groupCount}
        onClick={() => onChange('group')}
      />
      <PhaseTab
        active={active === 'knockout'}
        tone="knockout"
        icon={<Trophy className="h-4 w-4" />}
        label="Eliminatoria"
        count={knockoutCount}
        onClick={() => onChange('knockout')}
      />
    </div>
  );
}

function PhaseTab({
  active,
  tone,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  tone: 'group' | 'knockout';
  icon: React.ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}) {
  const activeClass =
    tone === 'knockout'
      ? 'border-w3-gold/40 bg-w3-gold-soft text-w3-white'
      : 'border-w3-border-strong bg-w3-score-box text-w3-white';

  const iconClass = active
    ? tone === 'knockout'
      ? 'text-w3-gold'
      : 'text-w3-silver'
    : 'text-w3-text-muted';

  const badgeClass = active
    ? tone === 'knockout'
      ? 'bg-w3-gold/15 text-w3-gold'
      : 'bg-white/10 text-w3-silver'
    : 'bg-w3-score-box text-w3-text-muted';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-1 items-center justify-center gap-2 rounded-[9px] border px-4 py-2 text-sm transition-colors sm:flex-none ${
        active
          ? `cursor-default font-semibold ${activeClass}`
          : 'cursor-pointer border-transparent font-medium text-w3-text-secondary hover:text-w3-white'
      }`}
    >
      <span className={iconClass}>{icon}</span>
      <span>{label}</span>
      <span
        className={`rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums ${badgeClass}`}
      >
        {count}
      </span>
    </button>
  );
}
