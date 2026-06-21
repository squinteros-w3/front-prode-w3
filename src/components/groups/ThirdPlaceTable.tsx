import type { ThirdPlaceRanking } from '../../lib/types';

interface Props {
  ranking: ThirdPlaceRanking;
}

/**
 * Ranking de los terceros de cada grupo. Los 8 mejores clasifican a 32avos.
 * Se actualiza partido a partido junto con las tablas de grupo.
 */
export default function ThirdPlaceTable({ ranking }: Props) {
  const { complete, rows } = ranking;

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="rounded-w3-card border border-w3-border bg-w3-surface p-4 sm:p-[18px]">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-base font-bold">Mejores terceros</h2>
        <span className="shrink-0 text-xs font-medium text-w3-text-muted">
          {complete ? 'Definitivo' : 'Provisorio'}
        </span>
      </div>
      <p className="mb-3.5 text-xs text-w3-text-secondary">
        Clasifican los 8 mejores a 32avos de final.
      </p>

      {/* Header */}
      <div className="mb-0.5 flex items-center gap-1.5 px-1 py-1 text-xs font-semibold text-w3-text-muted sm:gap-2 sm:px-2.5 sm:text-[13px]">
        <span className="w-4 text-center">#</span>
        <span className="w-7 text-center">GR</span>
        <span className="min-w-0 flex-1">EQUIPO</span>
        <span className="w-7 text-right sm:w-8">PJ</span>
        <span className="w-8 text-right sm:w-9">DG</span>
        <span className="w-8 text-right sm:w-9">PTS</span>
      </div>

      <div className="flex flex-col gap-0.5">
        {rows.map((row) => (
          <div
            key={row.team.id}
            className={`flex items-center gap-1.5 rounded-lg px-1.5 py-2 sm:gap-2 sm:px-2.5 ${
              row.qualified ? 'bg-w3-primary-soft/50' : ''
            }`}
          >
            <span
              className={`grid w-4 shrink-0 place-items-center text-xs font-bold sm:text-[13px] ${
                row.qualified ? 'text-w3-primary' : 'text-w3-text-muted'
              }`}
            >
              {row.rank}
            </span>

            <span className="grid w-7 shrink-0 place-items-center">
              <span className="grid h-5 w-5 place-items-center rounded bg-w3-score-box text-[11px] font-bold text-w3-text-secondary">
                {row.group}
              </span>
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
                <span className="sm:hidden">{row.team.code ?? row.team.name}</span>
                <span className="hidden sm:inline">{row.team.name}</span>
              </span>
            </div>

            <span className="w-7 shrink-0 text-right text-xs text-w3-text-secondary sm:w-8 sm:text-[13px]">
              {row.mp}
            </span>
            <span className="w-8 shrink-0 text-right text-xs text-w3-text-secondary sm:w-9 sm:text-[13px]">
              {row.gd > 0 ? `+${row.gd}` : row.gd}
            </span>
            <span className="w-8 shrink-0 text-right text-sm font-bold text-w3-primary sm:w-9">
              {row.pts}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
