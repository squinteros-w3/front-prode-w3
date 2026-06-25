import { ArrowRight, GitMerge, LayoutGrid } from 'lucide-react';

export type DayTab = 'today' | 'all';

interface Props {
  dayTab: DayTab;
  onDayTabChange: (tab: DayTab) => void;
  todayCount: number;
  allCount: number;
  /** Cambia el acceso directo de la derecha según la fase activa. */
  variant?: 'group' | 'knockout';
}

export default function MatchesToolbar({
  dayTab,
  onDayTabChange,
  todayCount,
  allCount,
  variant = 'group',
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Segmented control: día */}
      <div className="flex w-full gap-1 rounded-xl border border-w3-border bg-w3-surface p-1 sm:w-fit">
        <TabButton
          active={dayTab === 'today'}
          label="Hoy"
          count={todayCount}
          onClick={() => onDayTabChange('today')}
          className="flex-1 sm:flex-none"
        />
        <TabButton
          active={dayTab === 'all'}
          label="Todos"
          count={allCount}
          onClick={() => onDayTabChange('all')}
          className="flex-1 sm:flex-none"
        />
      </div>

      {/* Acceso directo a la otra vista de la fase */}
      {variant === 'knockout' ? (
        <a
          href="/eliminatoria"
          className="inline-flex w-full items-center justify-center gap-2 rounded-w3-sm border border-w3-border-strong bg-w3-gold-soft px-3.5 py-2 text-sm font-semibold text-w3-gold transition-opacity hover:opacity-90 sm:w-auto"
        >
          <GitMerge className="h-4 w-4" />
          <span className="sm:hidden">Bracket</span>
          <span className="hidden sm:inline">Ver bracket</span>
          <ArrowRight className="h-4 w-4" />
        </a>
      ) : (
        <a
          href="/grupos"
          className="inline-flex w-full items-center justify-center gap-2 rounded-w3-sm border border-w3-primary-border bg-w3-primary-soft px-3.5 py-2 text-sm font-semibold text-w3-primary transition-opacity hover:opacity-90 sm:w-auto"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="sm:hidden">Grupos</span>
          <span className="hidden sm:inline">Ver por grupos</span>
          <ArrowRight className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

function TabButton({
  active,
  label,
  count,
  onClick,
  className = '',
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center justify-center gap-1.5 rounded-[9px] px-4 py-2 text-sm transition-colors ${className} ${
        active
          ? 'cursor-default bg-w3-primary font-semibold text-w3-white'
          : 'cursor-pointer font-medium text-w3-text-secondary hover:text-w3-white'
      }`}
    >
      {label}
      <span
        className={`rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums ${
          active ? 'bg-white/20 text-w3-white' : 'bg-w3-score-box text-w3-text-muted'
        }`}
      >
        {count}
      </span>
    </button>
  );
}
