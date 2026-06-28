import { ArrowDown, ArrowRight, ArrowUp, Minus, RotateCcw } from 'lucide-react';
import type { SimulatedRow } from '../../lib/simulateStandings';
import type { StandingRow } from '../../lib/types';

interface Props {
  standings: StandingRow[];
  simulated?: SimulatedRow[];
  simulating: boolean;
  onSimulate: () => void;
  onResetSim: () => void;
  canSimulate: boolean;
  /** El 3º de este grupo clasificó a 16avos (mejor tercero). */
  qualifiedThird?: boolean;
}

export default function GroupStandingsTable({
  standings,
  simulated,
  simulating,
  onSimulate,
  onResetSim,
  canSimulate,
  qualifiedThird = false,
}: Props) {
  const rows = simulating && simulated ? simulated : standings;
  const showDelta = simulating && simulated;

  return (
    <div
      className={`rounded-w3-card border bg-w3-surface p-4 sm:p-[18px] ${
        simulating ? 'border-w3-primary-border' : 'border-w3-border'
      }`}
    >
      <div className="mb-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold">Tabla del grupo</h2>
          {simulating && (
            <p className="mt-0.5 text-xs font-medium text-w3-primary">
              Tabla según tus predicciones
            </p>
          )}
        </div>

        {simulating ? (
          <button
            type="button"
            onClick={onResetSim}
            className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-w3-sm border border-w3-border bg-w3-surface-muted px-3 py-1.5 text-[13px] font-semibold text-w3-text-secondary transition-colors hover:text-w3-white sm:w-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Ver real
          </button>
        ) : (
          <div className="group relative w-full shrink-0 sm:w-auto">
            <button
              type="button"
              onClick={onSimulate}
              disabled={!canSimulate}
              className="inline-flex w-full items-center justify-center rounded-w3-sm border border-w3-primary-border bg-w3-primary-soft px-3 py-1.5 text-[13px] font-semibold text-w3-primary transition-colors hover:bg-w3-primary/20 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              <span className="sm:hidden">Simular predicciones</span>
              <span className="hidden sm:inline">Simular con mis predicciones</span>
            </button>
            {!canSimulate && (
              <span className="pointer-events-none absolute right-0 top-full z-10 mt-1.5 hidden w-max max-w-[240px] rounded-md border border-w3-border bg-w3-surface-muted px-2.5 py-1.5 text-[11px] font-medium text-w3-text-secondary shadow-lg group-hover:block">
                Cargá al menos una predicción en este grupo para simular tu tabla.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="mb-0.5 flex items-center gap-1.5 px-1 py-1 text-xs font-semibold text-w3-text-muted sm:gap-2 sm:px-2.5 sm:text-[13px]">
        <span className="w-4 text-center">#</span>
        <span className="min-w-0 flex-1">EQUIPO</span>
        {showDelta && (
          <span className="group relative w-9 cursor-help text-center">
            Δ
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-w3-border bg-w3-surface-muted px-2 py-1 text-[11px] font-medium normal-case text-w3-text-secondary shadow-lg group-hover:block">
              Diferencia de posición respecto a la tabla real
            </span>
          </span>
        )}
        {showDelta ? (
          <>
            <span className="w-8 text-right sm:w-10">SIM</span>
            <span className="w-8 text-right sm:w-10">REAL</span>
          </>
        ) : (
          <>
            <span className="w-7 text-right sm:w-8">PJ</span>
            <span className="w-8 text-right sm:w-9">DG</span>
            <span className="w-8 text-right sm:w-9">PTS</span>
          </>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        {rows.map((row, i) => {
          const simRow = showDelta ? (row as SimulatedRow) : null;
          const inZone = i < 2;
          const thirdQualified = i === 2 && qualifiedThird;

          return (
            <div
              key={row.team.id}
              className={`flex items-center gap-1.5 rounded-lg px-1.5 py-2 sm:gap-2 sm:px-2.5 ${
                inZone
                  ? 'bg-w3-surface-muted'
                  : thirdQualified
                    ? 'bg-w3-primary-soft/30'
                    : ''
              }`}
            >
              <span className="w-4 shrink-0 text-center text-xs font-bold text-w3-white sm:text-[13px]">
                {i + 1}
              </span>

              <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
                {row.team.flagUrl ? (
                  <img
                    src={row.team.flagUrl}
                    alt=""
                    className="h-[19px] w-[26px] shrink-0 rounded object-cover ring-1 ring-w3-border"
                  />
                ) : (
                  <span className="h-[19px] w-[26px] shrink-0 rounded bg-w3-score-box" />
                )}
                <span className="truncate text-xs font-semibold sm:text-sm">
                  <span className="sm:hidden">
                    {row.team.code ?? row.team.name}
                  </span>
                  <span className="hidden sm:inline">{row.team.name}</span>
                </span>
              </div>

              {showDelta && simRow ? (
                <>
                  <DeltaBadge delta={simRow.delta} />
                  <span className="w-8 shrink-0 text-right text-sm font-bold text-w3-primary sm:w-10">
                    {row.pts}
                  </span>
                  <span className="w-8 shrink-0 text-right text-xs font-medium text-w3-text-muted sm:w-10 sm:text-[13px]">
                    {simRow.realPts}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-7 shrink-0 text-right text-xs text-w3-text-secondary sm:w-8 sm:text-[13px]">
                    {row.mp}
                  </span>
                  <span className="w-8 shrink-0 text-right text-xs text-w3-text-secondary sm:w-9 sm:text-[13px]">
                    {row.gd > 0 ? `+${row.gd}` : row.gd}
                  </span>
                  <span className="w-8 shrink-0 text-right text-sm font-bold text-w3-primary sm:w-9">
                    {row.pts}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span
        title={`Sube ${delta} ${delta === 1 ? 'posición' : 'posiciones'} respecto a la tabla real`}
        className="flex w-9 items-center justify-center gap-0.5 text-[13px] font-semibold text-w3-primary"
      >
        <ArrowUp className="h-3 w-3" />
        {delta}
      </span>
    );
  }
  if (delta < 0) {
    const abs = Math.abs(delta);
    return (
      <span
        title={`Baja ${abs} ${abs === 1 ? 'posición' : 'posiciones'} respecto a la tabla real`}
        className="flex w-9 items-center justify-center gap-0.5 text-[13px] font-semibold text-w3-live"
      >
        <ArrowDown className="h-3 w-3" />
        {abs}
      </span>
    );
  }
  return (
    <span
      title="Misma posición que en la tabla real"
      className="flex w-9 items-center justify-center text-[13px] font-semibold text-w3-text-muted"
    >
      <Minus className="h-3 w-3" />
    </span>
  );
}

/** Tabla compacta para el modo overview (todos los grupos). */
export function GroupStandingsOverviewCard({
  group,
  standings,
  qualifiedThird = false,
}: {
  group: string;
  standings: StandingRow[];
  qualifiedThird?: boolean;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-w3-card border border-w3-border bg-w3-surface transition-colors group-hover:border-w3-primary-border">
      <div className="flex items-center gap-2 border-b border-w3-border bg-w3-surface-muted px-4 py-2.5">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-w3-primary text-xs font-extrabold text-w3-black">
          {group}
        </span>
        <span className="text-sm font-bold">Grupo {group}</span>
      </div>

      <div className="p-2">
        {standings.map((s, i) => {
          const thirdQualified = i === 2 && qualifiedThird;
          return (
          <div
            key={s.team.id}
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
              i < 2
                ? 'bg-w3-primary-soft/50'
                : thirdQualified
                  ? 'bg-w3-primary-soft/25'
                  : ''
            }`}
          >
            <span
              className={`grid h-5 w-5 place-items-center rounded text-[11px] font-bold ${
                i < 2 || thirdQualified
                  ? 'bg-w3-primary/25 text-w3-primary'
                  : 'text-w3-text-muted'
              }`}
            >
              {i + 1}
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {s.team.flagUrl ? (
                <img
                  src={s.team.flagUrl}
                  alt=""
                  className="h-4 w-6 rounded-sm object-cover ring-1 ring-w3-border"
                />
              ) : (
                <span className="h-4 w-6 rounded-sm bg-w3-score-box" />
              )}
              <span className="truncate text-sm font-medium">{s.team.name}</span>
            </div>
            <span className="text-sm font-bold text-w3-primary">{s.pts}</span>
          </div>
          );
        })}
      </div>

      <div className="mt-auto flex items-center justify-end gap-1 border-t border-w3-border px-4 py-2 text-xs font-medium text-w3-text-muted transition-colors group-hover:text-w3-primary">
        <span>Ver tabla y mis predicciones</span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </div>
  );
}
