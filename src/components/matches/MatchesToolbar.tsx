import { ArrowRight, LayoutGrid, X } from 'lucide-react';
import type { StatusFilter } from '../../lib/matchPhase';

export type DayTab = 'today' | 'all';

interface Props {
  dayTab: DayTab;
  onDayTabChange: (tab: DayTab) => void;
  todayCount: number;
  allCount: number;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
}

export default function MatchesToolbar({
  dayTab,
  onDayTabChange,
  todayCount,
  allCount,
  statusFilter,
  onStatusFilterChange,
}: Props) {
  // Click en el chip activo lo apaga (vuelve a "todos").
  const finishedActive = statusFilter === 'finished';
  function toggleFinished() {
    onStatusFilterChange(finishedActive ? 'all' : 'finished');
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Segmented control: día */}
      <div className="flex w-full gap-1 rounded-xl border border-w3-border bg-w3-surface p-1 sm:w-auto">
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

      {/* Filtros de estado + acceso a grupos */}
      <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-2.5">
        <FilterChip
          label="Partidos Finalizados"
          shortLabel="Finalizados"
          active={finishedActive}
          onClick={toggleFinished}
          className="flex-1 sm:flex-none"
        />

        <div className="hidden h-6 w-px shrink-0 bg-w3-border sm:block" />

        <a
          href="/grupos"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-w3-sm border border-w3-border bg-w3-surface px-3.5 py-2 text-sm font-semibold text-w3-text-secondary transition-colors hover:text-w3-white sm:w-auto sm:flex-none"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="sm:hidden">Grupos</span>
          <span className="hidden sm:inline">Ver por grupos</span>
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  shortLabel,
  active,
  onClick,
  className = '',
}: {
  label: string;
  shortLabel?: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={active ? 'Quitar filtro' : undefined}
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-w3-sm border px-3.5 py-2 text-sm font-semibold transition-colors ${className} ${
        active
          ? 'border-w3-primary-border bg-w3-primary-soft text-w3-primary'
          : 'border-w3-border bg-w3-surface text-w3-text-secondary hover:text-w3-white'
      }`}
    >
      {shortLabel ? (
        <>
          <span className="sm:hidden">{shortLabel}</span>
          <span className="hidden sm:inline">{label}</span>
        </>
      ) : (
        label
      )}
      {active && <X className="h-3.5 w-3.5 shrink-0" />}
    </button>
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
      className={`flex items-center justify-center gap-1.5 rounded-[9px] px-4 py-2 text-sm font-medium transition-colors ${className} ${
        active
          ? 'cursor-default bg-w3-primary font-semibold text-w3-black'
          : 'cursor-pointer text-w3-text-secondary hover:text-w3-white'
      }`}
    >
      {label}
      <span
        className={`rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums ${
          active
            ? 'bg-w3-black/20 text-w3-black'
            : 'bg-w3-score-box text-w3-text-muted'
        }`}
      >
        {count}
      </span>
    </button>
  );
}
