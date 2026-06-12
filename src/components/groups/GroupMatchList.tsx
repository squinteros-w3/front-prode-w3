import { ArrowRight, Lock, PencilLine } from 'lucide-react';
import { formatShortDate } from '../../lib/format';
import type { MatchView } from '../../lib/types';

interface Props {
  matches: MatchView[];
}

export default function GroupMatchList({ matches }: Props) {
  const played = matches.filter((m) => m.status === 'FINISHED').length;

  return (
    <div className="rounded-w3-card border border-w3-border bg-w3-surface p-4 sm:p-[18px]">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-base font-bold">Partidos del grupo</h2>
        <span className="text-xs font-medium text-w3-text-muted sm:text-[13px]">
          {matches.length} partidos · {played} jugado{played !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {matches.map((m) => (
          <CompactMatchRow key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

function predictionHref(match: MatchView): string | null {
  if (match.status !== 'SCHEDULED') return null;
  return `/partidos?partido=${match.id}`;
}

function MatchStatus({
  finished,
  hasPrediction,
  linked,
}: {
  finished: boolean;
  hasPrediction: boolean;
  linked: boolean;
}) {
  if (finished) {
    return (
      <span className="text-xs font-medium text-w3-text-muted">Finalizado</span>
    );
  }
  if (hasPrediction) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-w3-text-secondary">
        <Lock className="h-3 w-3" />
        Tu predicción
        {linked && <ArrowRight className="h-3 w-3 text-w3-primary" />}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-w3-primary">
      <PencilLine className="h-3 w-3" />
      Cargá predicción
      {linked && <ArrowRight className="h-3 w-3" />}
    </span>
  );
}

function CompactMatchRow({ match }: { match: MatchView }) {
  const finished = match.status === 'FINISHED';
  const hasPrediction = match.prediction != null;
  const href = predictionHref(match);
  const linked = href != null;

  const homeScore = finished
    ? String(match.homeScore)
    : hasPrediction
      ? String(match.prediction!.homeScore)
      : '–';
  const awayScore = finished
    ? String(match.awayScore)
    : hasPrediction
      ? String(match.prediction!.awayScore)
      : '–';

  const scoreColor = finished
    ? 'text-w3-white'
    : hasPrediction
      ? 'text-w3-primary'
      : 'text-w3-text-muted';

  const rowClass = [
    'block rounded-[10px] bg-w3-surface-muted px-3 py-3 sm:px-3.5',
    linked
      ? 'transition-colors hover:bg-w3-score-box hover:ring-1 hover:ring-w3-primary-border'
      : '',
  ].join(' ');

  const content = (
    <>
      {/* Mobile layout */}
      <div className="flex flex-col gap-2.5 md:hidden">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-w3-text-muted">
              FECHA {match.matchday ?? '–'}
            </p>
            <p className="text-[13px] font-medium text-w3-text-secondary">
              {formatShortDate(match.kickoffAt)}
            </p>
          </div>
          <MatchStatus
            finished={finished}
            hasPrediction={hasPrediction}
            linked={linked}
          />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex min-w-0 items-center justify-end gap-2">
            <span className="truncate text-right text-sm font-semibold">
              {match.homeTeam.code ?? match.homeTeam.name}
            </span>
            <TeamFlag flagUrl={match.homeTeam.flagUrl} />
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <span
              className={`font-display text-lg font-bold tabular-nums ${scoreColor}`}
            >
              {homeScore}
            </span>
            <span className="font-display text-sm font-bold text-w3-text-muted">
              :
            </span>
            <span
              className={`font-display text-lg font-bold tabular-nums ${scoreColor}`}
            >
              {awayScore}
            </span>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <TeamFlag flagUrl={match.awayTeam.flagUrl} />
            <span className="truncate text-sm font-semibold">
              {match.awayTeam.code ?? match.awayTeam.name}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden items-center gap-3 md:flex">
        <div className="w-16 shrink-0">
          <p className="text-[11px] font-semibold tracking-wide text-w3-text-muted">
            FECHA {match.matchday ?? '–'}
          </p>
          <p className="text-[13px] font-medium text-w3-text-secondary">
            {formatShortDate(match.kickoffAt)}
          </p>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className="truncate text-right text-sm font-semibold">
            {match.homeTeam.name}
          </span>
          <TeamFlag flagUrl={match.homeTeam.flagUrl} />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span
            className={`font-display text-xl font-bold tabular-nums ${scoreColor}`}
          >
            {homeScore}
          </span>
          <span className="font-display text-[15px] font-bold text-w3-text-muted">
            :
          </span>
          <span
            className={`font-display text-xl font-bold tabular-nums ${scoreColor}`}
          >
            {awayScore}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TeamFlag flagUrl={match.awayTeam.flagUrl} />
          <span className="truncate text-sm font-semibold">
            {match.awayTeam.name}
          </span>
        </div>

        <div className="w-32 shrink-0">
          <MatchStatus
            finished={finished}
            hasPrediction={hasPrediction}
            linked={linked}
          />
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} className={rowClass} aria-label="Ir a cargar predicción">
        {content}
      </a>
    );
  }

  return <div className={rowClass}>{content}</div>;
}

function TeamFlag({ flagUrl }: { flagUrl: string | null }) {
  if (flagUrl) {
    return (
      <img
        src={flagUrl}
        alt=""
        className="h-[19px] w-[26px] shrink-0 rounded object-cover ring-1 ring-w3-border"
      />
    );
  }
  return <span className="h-[19px] w-[26px] shrink-0 rounded bg-w3-score-box" />;
}
