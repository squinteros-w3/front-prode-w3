import {
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Lock,
  PencilLine,
  Trophy,
  Users,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { formatKickoff, formatKickoffCompact } from '../../lib/format';
import { getPhase, stageLabel, type PhaseInfo } from '../../lib/matchPhase';
import type {
  LivePredictionEntry,
  LivePredictions,
  MatchPrediction,
  MatchResultEntry,
  MatchResults,
  MatchView,
  PenaltyWinner,
} from '../../lib/types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type ResultsState = 'idle' | 'loading' | 'loaded' | 'error';

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function ResultAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className="h-6 w-6 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-w3-primary-border bg-w3-primary-soft text-[10px] font-bold text-w3-primary">
      {initials(name)}
    </span>
  );
}

/** Ganador por penales elegido en un empate de eliminación: "› bandera". */
function PenaltyWinnerFlag({
  winner,
  match,
}: {
  winner: PenaltyWinner;
  match: MatchView;
}) {
  const team = winner === 'HOME' ? match.homeTeam : match.awayTeam;
  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-w3-text-muted"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
      {team.flagUrl ? (
        <img
          src={team.flagUrl}
          alt={team.code ?? team.name}
          title={team.name}
          className="h-[11px] w-[16px] shrink-0 rounded-[2px] object-cover ring-1 ring-white/10"
        />
      ) : (
        <span className="text-[11px] font-bold text-w3-text-secondary">
          {team.code ?? team.name}
        </span>
      )}
    </>
  );
}

/** Bandera chica para la línea de penales del resultado real. */
function PenFlag({ flagUrl, label }: { flagUrl: string | null; label: string }) {
  if (flagUrl) {
    return (
      <img
        src={flagUrl}
        alt={label}
        title={label}
        className="h-[11px] w-[16px] shrink-0 rounded-[2px] object-cover ring-1 ring-white/10"
      />
    );
  }
  return (
    <span className="h-[11px] w-[16px] shrink-0 rounded-[2px] bg-white/10" />
  );
}

type ResultTone = 'gold' | 'exact' | 'outcome' | 'miss';

const RESULT_TONE: Record<
  ResultTone,
  { title: string; chip: string; badge: string }
> = {
  gold: {
    title: 'text-w3-gold',
    chip: 'border-w3-gold/40 bg-w3-gold-soft',
    badge: 'bg-w3-gold/15 text-w3-gold',
  },
  exact: {
    title: 'text-w3-primary',
    chip: 'border-w3-primary-border bg-w3-primary-soft',
    badge: 'bg-w3-primary-soft text-w3-primary',
  },
  outcome: {
    title: 'text-w3-text-secondary',
    chip: 'border-w3-border bg-w3-surface',
    badge: 'bg-w3-score-box text-w3-text-secondary',
  },
  miss: {
    title: 'text-w3-text-muted',
    chip: 'border-w3-border bg-w3-surface',
    badge: '',
  },
};

function ResultGroup({
  title,
  entries,
  tone,
  match,
}: {
  title: string;
  entries: MatchResultEntry[];
  tone: ResultTone;
  match: MatchView;
}) {
  if (entries.length === 0) return null;
  const styles = RESULT_TONE[tone];

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className={`text-[11px] font-bold uppercase tracking-wide ${styles.title}`}>
          {title}
        </span>
        <span className="rounded-full bg-w3-score-box px-1.5 py-0.5 text-[10px] font-semibold text-w3-text-muted">
          {entries.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {entries.map((e) => (
          <span
            key={e.user.id}
            className={`inline-flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2 ${styles.chip}`}
          >
            <ResultAvatar name={e.user.name} avatarUrl={e.user.avatarUrl} />
            <span className="text-xs font-semibold text-w3-white">
              {e.user.name}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium tabular-nums text-w3-text-muted">
              {e.homeScore}–{e.awayScore}
              {e.penaltyWinner && (
                <PenaltyWinnerFlag winner={e.penaltyWinner} match={match} />
              )}
            </span>
            {tone !== 'miss' && (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${styles.badge}`}
              >
                +{e.points}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ phase }: { phase: PhaseInfo }) {
  return (
    <span
      title={phase.hint}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs ${phase.badgeFill} ${phase.badgeText}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {phase.pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${phase.dotColor}`}
          />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${phase.dotColor}`}
        />
      </span>
      {phase.label}
    </span>
  );
}

function TeamFlag({ flagUrl }: { flagUrl: string | null }) {
  if (flagUrl) {
    return (
      <img
        src={flagUrl}
        alt=""
        className="h-5 w-7 shrink-0 rounded-[4px] object-cover ring-1 ring-w3-border sm:h-[23px] sm:w-8 sm:rounded-[5px]"
      />
    );
  }
  return (
    <span className="h-5 w-7 shrink-0 rounded-[4px] bg-w3-score-box sm:h-[23px] sm:w-8 sm:rounded-[5px]" />
  );
}

function ScoreStepper({
  value,
  onChange,
  editable,
  highlight,
}: {
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
  highlight: boolean;
}) {
  const num = value === '' ? null : Number(value);

  function step(delta: number) {
    const current = num ?? 0;
    const next = Math.max(0, Math.min(99, current + delta));
    onChange(String(next));
  }

  const boxClass = highlight
    ? 'border-w3-primary-border bg-w3-primary-soft'
    : 'border-w3-border-strong bg-w3-score-box';

  if (!editable) {
    return (
      <div
        className={`flex w-14 flex-col items-center justify-center rounded-xl border py-1.5 sm:w-[60px] sm:py-2 ${boxClass}`}
      >
        <span className="font-display text-xl font-bold tabular-nums text-w3-white sm:text-[26px]">
          {value === '' ? '–' : value}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex w-14 flex-col items-center rounded-xl border sm:w-[60px] ${boxClass}`}
    >
      <button
        type="button"
        onClick={() => step(1)}
        className="flex h-8 w-full items-center justify-center text-w3-text-muted transition-colors active:bg-white/5 active:text-w3-white sm:h-4"
        aria-label="Sumar"
      >
        <ChevronUp className="h-4 w-4 sm:h-4" />
      </button>
      <input
        type="number"
        min={0}
        max={99}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 2))}
        placeholder="–"
        className="h-7 w-full bg-transparent text-center font-display text-xl font-bold tabular-nums text-w3-white outline-none [appearance:textfield] placeholder:text-w3-text-muted sm:h-auto sm:text-[26px] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        aria-label="Marcador"
      />
      <button
        type="button"
        onClick={() => step(-1)}
        className="flex h-8 w-full items-center justify-center text-w3-text-muted transition-colors active:bg-white/5 active:text-w3-white sm:h-4"
        aria-label="Restar"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}

function scoresFromPrediction(prediction: MatchView['prediction']) {
  return {
    home: prediction ? String(prediction.homeScore) : '',
    away: prediction ? String(prediction.awayScore) : '',
    penWinner: prediction?.penaltyWinner ?? null,
  };
}

/** Nombre corto del lado ganador por penales. */
function sideName(side: PenaltyWinner, match: MatchView): string {
  const team = side === 'HOME' ? match.homeTeam : match.awayTeam;
  return team.code ?? team.name;
}

export default function MatchCard({
  match,
  now,
  onPredictionSaved,
}: {
  match: MatchView;
  now: number;
  onPredictionSaved?: (matchId: string, prediction: MatchPrediction) => void;
}) {
  const initial = scoresFromPrediction(match.prediction);

  const [home, setHome] = useState(initial.home);
  const [away, setAway] = useState(initial.away);
  const [penWinner, setPenWinner] = useState<PenaltyWinner | null>(
    initial.penWinner,
  );
  const [savedHome, setSavedHome] = useState(initial.home);
  const [savedAway, setSavedAway] = useState(initial.away);
  const [savedPenWinner, setSavedPenWinner] = useState<PenaltyWinner | null>(
    initial.penWinner,
  );
  const [state, setState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);

  const [expanded, setExpanded] = useState(false);
  const [resultsState, setResultsState] = useState<ResultsState>('idle');
  const [results, setResults] = useState<MatchResults | null>(null);

  const [liveExpanded, setLiveExpanded] = useState(false);
  const [liveState, setLiveState] = useState<ResultsState>('idle');
  const [livePreds, setLivePreds] = useState<LivePredictions | null>(null);

  useEffect(() => {
    const next = scoresFromPrediction(match.prediction);
    setHome(next.home);
    setAway(next.away);
    setPenWinner(next.penWinner);
    setSavedHome(next.home);
    setSavedAway(next.away);
    setSavedPenWinner(next.penWinner);
  }, [
    match.id,
    match.prediction?.homeScore,
    match.prediction?.awayScore,
    match.prediction?.penaltyWinner,
  ]);

  const editable = !match.locked && match.status === 'SCHEDULED';
  const finished = match.status === 'FINISHED';
  const phase = getPhase(match, now);
  const isLive = phase.key === 'live';

  // En eliminación, un empate va a penales: el usuario elige el ganador.
  const isKnockout = match.stage !== 'group';
  const bothFilled = home !== '' && away !== '';
  const isDraw = bothFilled && home === away;
  const needsWinner = isKnockout && isDraw;
  const effectiveWinner: PenaltyWinner | null = needsWinner ? penWinner : null;

  const hasSaved = savedHome !== '' && savedAway !== '';
  const changed =
    home !== savedHome ||
    away !== savedAway ||
    effectiveWinner !== savedPenWinner;
  const dirty = editable && bothFilled && changed;

  const openNoPrediction = editable && !hasSaved && !bothFilled;
  const lockedWithPrediction = !editable && hasSaved;

  const cardBorder =
    phase.key === 'live'
      ? 'border-w3-live'
      : openNoPrediction
        ? 'border-w3-primary-border'
        : 'border-w3-border';

  const cardBg = finished ? 'bg-w3-surface-muted' : 'bg-w3-surface';

  // Los casilleros grandes muestran TU PREDICCIÓN. En edición usan el valor que
  // estás cargando; en partidos finalizados o cerrados muestran el pronóstico
  // guardado. El resultado real se ve solo en el footer.
  const displayHome = editable ? home : savedHome;
  const displayAway = editable ? away : savedAway;

  async function save() {
    const h = Number(home);
    const a = Number(away);
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) {
      setError('Cargá ambos marcadores (0 o más).');
      setState('error');
      return;
    }
    if (needsWinner && !penWinner) {
      setError('Es empate: elegí quién gana por penales.');
      setState('error');
      return;
    }
    setState('saving');
    setError(null);
    try {
      const res = await fetch(`/api/predictions/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeScore: h,
          awayScore: a,
          penaltyWinner: effectiveWinner,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? 'No se pudo guardar');
      }
      const data = await res.json();
      const prediction: MatchPrediction = {
        homeScore: data.homeScore ?? h,
        awayScore: data.awayScore ?? a,
        penaltyWinner: data.penaltyWinner ?? effectiveWinner,
        pointsAwarded: data.pointsAwarded ?? 0,
        isExact: data.isExact ?? false,
      };
      setSavedHome(home);
      setSavedAway(away);
      setSavedPenWinner(effectiveWinner);
      setState('saved');
      onPredictionSaved?.(match.id, prediction);
    } catch (e) {
      setError((e as Error).message);
      setState('error');
    }
  }

  async function toggleResults() {
    const next = !expanded;
    setExpanded(next);
    if (!next || resultsState === 'loaded' || resultsState === 'loading') return;
    setResultsState('loading');
    try {
      const res = await fetch(`/api/matches/${match.id}/results`);
      if (!res.ok) throw new Error('No se pudo cargar');
      const data = (await res.json()) as MatchResults;
      setResults(data);
      setResultsState('loaded');
    } catch {
      setResultsState('error');
    }
  }

  async function toggleLive() {
    const next = !liveExpanded;
    setLiveExpanded(next);
    if (!next || liveState === 'loaded' || liveState === 'loading') return;
    setLiveState('loading');
    try {
      const res = await fetch(`/api/matches/${match.id}/live-predictions`);
      if (!res.ok) throw new Error('No se pudo cargar');
      const data = (await res.json()) as LivePredictions;
      setLivePreds(data);
      setLiveState('loaded');
    } catch {
      setLiveState('error');
    }
  }

  function handleHome(v: string) {
    setHome(v);
    if (state !== 'idle') setState('idle');
  }

  function handleAway(v: string) {
    setAway(v);
    if (state !== 'idle') setState('idle');
  }

  function handlePenWinner(side: PenaltyWinner) {
    setPenWinner(side);
    if (state !== 'idle') setState('idle');
  }

  const points = match.prediction?.pointsAwarded ?? 0;
  // Resultado real definido por penales (lo carga el admin en eliminación).
  const realWentToPens =
    match.homePenalties !== null && match.awayPenalties !== null;
  // Lado que avanzó por penales (para resaltar su número en blanco).
  const penHomeAdvanced =
    realWentToPens && (match.homePenalties ?? 0) > (match.awayPenalties ?? 0);
  const penAwayAdvanced =
    realWentToPens && (match.awayPenalties ?? 0) > (match.homePenalties ?? 0);

  return (
    <div
      className={`rounded-2xl border px-3.5 py-3 transition-colors sm:rounded-w3-card sm:px-[22px] sm:py-[18px] ${cardBorder} ${cardBg} ${
        phase.key === 'live' ? 'ring-1 ring-w3-live/30' : ''
      }`}
    >
      {/* Meta: siempre una sola fila */}
      <div className="mb-2.5 flex items-center justify-between gap-2 sm:mb-4">
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden sm:gap-2.5">
          {match.stage === 'group' && match.group ? (
            <a
              href={`/grupos?grupo=${match.group}`}
              title={`Ver el Grupo ${match.group}`}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-w3-border bg-w3-silver-soft px-1.5 py-0.5 text-[11px] font-semibold text-w3-silver transition-colors hover:border-w3-primary-border hover:text-w3-primary sm:gap-1.5 sm:rounded-lg sm:px-2 sm:text-xs"
            >
              <LayoutGrid className="h-3 w-3 shrink-0" />
              {stageLabel(match)}
            </a>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-w3-border bg-w3-gold-soft px-1.5 py-0.5 text-[11px] font-semibold text-w3-gold sm:gap-1.5 sm:rounded-lg sm:px-2 sm:text-xs">
              <Trophy className="h-3 w-3 shrink-0" />
              {stageLabel(match)}
            </span>
          )}
          <span className="truncate text-[11px] font-medium text-w3-text-muted sm:hidden">
            {formatKickoffCompact(match.kickoffAt)}
          </span>
          <span className="hidden truncate text-[13px] font-medium text-w3-text-muted sm:inline">
            {formatKickoff(match.kickoffAt)}
          </span>
        </div>
        <StatusBadge phase={phase} />
      </div>

      {/* Partido */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 sm:gap-4">
        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-3">
          <span className="truncate text-right text-sm font-semibold sm:text-[17px]">
            <span className="sm:hidden">
              {match.homeTeam.code ?? match.homeTeam.name}
            </span>
            <span className="hidden sm:inline">{match.homeTeam.name}</span>
          </span>
          <TeamFlag flagUrl={match.homeTeam.flagUrl} />
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2.5">
          <ScoreStepper
            value={displayHome}
            onChange={handleHome}
            editable={editable}
            highlight={openNoPrediction}
          />
          <span className="font-display text-base font-bold text-w3-text-muted sm:text-[22px]">
            :
          </span>
          <ScoreStepper
            value={displayAway}
            onChange={handleAway}
            editable={editable}
            highlight={openNoPrediction}
          />
        </div>

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          <TeamFlag flagUrl={match.awayTeam.flagUrl} />
          <span className="truncate text-sm font-semibold sm:text-[17px]">
            <span className="sm:hidden">
              {match.awayTeam.code ?? match.awayTeam.name}
            </span>
            <span className="hidden sm:inline">{match.awayTeam.name}</span>
          </span>
        </div>
      </div>

      {/* Empate en eliminación: el usuario elige el ganador por penales (+2 si acierta). */}
      {editable && needsWinner && (
        <div className="mt-2.5 rounded-xl border border-w3-primary-border bg-w3-primary-soft px-3 py-2 sm:mt-3.5">
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-w3-text-secondary sm:text-xs">
            <Trophy className="h-3 w-3 shrink-0 text-w3-gold" />
            Empate: ¿quién gana por penales?{' '}
            <span className="font-medium text-w3-text-muted">+2 si acertás</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(['HOME', 'AWAY'] as const).map((side) => {
              const selected = penWinner === side;
              const team = side === 'HOME' ? match.homeTeam : match.awayTeam;
              return (
                <button
                  key={side}
                  type="button"
                  onClick={() => handlePenWinner(side)}
                  aria-pressed={selected}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors sm:text-[13px] ${
                    selected
                      ? 'border-w3-primary bg-w3-primary text-w3-black'
                      : 'border-w3-border bg-w3-surface text-w3-text-secondary hover:border-w3-primary-border hover:text-w3-white'
                  }`}
                >
                  <TeamFlag flagUrl={team.flagUrl} />
                  <span className="truncate">{team.code ?? team.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer compacto en mobile */}
      <div className="mt-2 flex min-h-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-1.5 text-center sm:min-h-[34px] sm:pt-2">
        {finished && (
          <button
            type="button"
            onClick={toggleResults}
            aria-expanded={expanded}
            title="Ver quiénes acertaron"
            className="group inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full px-1.5 py-0.5 transition-colors hover:bg-w3-surface-muted"
          >
            <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-xs font-medium text-w3-text-secondary sm:text-[13px]">
              <span className="sm:hidden">
                Real {match.homeScore}–{match.awayScore}
              </span>
              <span className="hidden sm:inline">
                Resultado real: {match.homeScore}–{match.awayScore}
              </span>
              {realWentToPens && (
                <span className="inline-flex items-center gap-1 text-w3-text-muted">
                  <span aria-hidden>·</span>
                  <PenFlag
                    flagUrl={match.homeTeam.flagUrl}
                    label={match.homeTeam.name}
                  />
                  <span className="font-semibold tabular-nums">
                    <span
                      className={
                        penHomeAdvanced ? 'text-w3-white' : 'text-w3-text-secondary'
                      }
                    >
                      {match.homePenalties}
                    </span>
                    <span className="text-w3-text-muted">–</span>
                    <span
                      className={
                        penAwayAdvanced ? 'text-w3-white' : 'text-w3-text-secondary'
                      }
                    >
                      {match.awayPenalties}
                    </span>
                  </span>
                  <PenFlag
                    flagUrl={match.awayTeam.flagUrl}
                    label={match.awayTeam.name}
                  />
                </span>
              )}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold sm:text-xs ${
                points >= 3
                  ? 'bg-w3-primary text-w3-black'
                  : points === 1
                    ? 'bg-w3-primary-soft text-w3-primary'
                    : 'bg-w3-score-box text-w3-text-muted'
              }`}
            >
              {points > 0 && <Check className="h-3 w-3" />}
              {points === 5
                ? '¡Exacto + penales! +5'
                : points === 3
                  ? '¡Exacto! +3'
                  : points === 1
                    ? '+1'
                    : '+0'}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-w3-text-muted transition-colors group-hover:text-w3-primary sm:text-xs">
              <Users className="h-3 w-3" />
              <span>Quién acertó</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  expanded ? 'rotate-180' : ''
                }`}
              />
            </span>
          </button>
        )}

        {isLive && (
          <button
            type="button"
            onClick={toggleLive}
            aria-expanded={liveExpanded}
            title="Ver qué pronosticaron y cómo viene la tendencia"
            className="group inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full px-1.5 py-0.5 transition-colors hover:bg-w3-surface-muted"
          >
            {lockedWithPrediction && (
              <span className="text-xs font-medium text-w3-text-secondary sm:text-[13px]">
                Tu pronóstico: {savedHome}–{savedAway}
                {savedPenWinner &&
                  ` · gana ${sideName(savedPenWinner, match)} por penales`}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-w3-live transition-colors group-hover:opacity-80 sm:text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Ver pronósticos</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  liveExpanded ? 'rotate-180' : ''
                }`}
              />
            </span>
          </button>
        )}

        {lockedWithPrediction && !finished && !isLive && (
          <span className="inline-flex items-center gap-1 rounded-full border border-w3-border bg-w3-surface-muted px-2 py-0.5 text-xs font-semibold text-w3-text-secondary sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[13px]">
            <Lock className="h-3 w-3 text-w3-text-muted" />
            <span className="sm:hidden">
              {savedPenWinner
                ? `${savedHome}–${savedAway} · pen ${sideName(savedPenWinner, match)}`
                : 'Pronóstico cerrado'}
            </span>
            <span className="hidden sm:inline">
              {savedPenWinner
                ? `Tu pronóstico: ${savedHome}–${savedAway} · gana ${sideName(savedPenWinner, match)} por penales`
                : 'Tu pronóstico está cerrado'}
            </span>
          </span>
        )}

        {editable && (
          <>
            {error && state === 'error' && (
              <span className="w-full text-xs text-red-400">{error}</span>
            )}

            {dirty || state === 'saving' ? (
              <button
                type="button"
                onClick={save}
                disabled={state === 'saving'}
                className="rounded-lg bg-w3-primary px-4 py-2 text-sm font-semibold text-w3-black transition-opacity hover:opacity-90 disabled:opacity-60 sm:py-1.5"
              >
                {state === 'saving'
                  ? 'Guardando…'
                  : hasSaved
                    ? 'Actualizar'
                    : 'Guardar'}
              </button>
            ) : state === 'saved' && !dirty ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-w3-primary sm:gap-1.5 sm:text-[13px]">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span className="sm:hidden">¡Guardado!</span>
                <span className="hidden sm:inline">¡Predicción guardada!</span>
              </span>
            ) : hasSaved ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-w3-primary sm:gap-1.5 sm:text-[13px]">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span className="sm:hidden">Guardada · editá para cambiar</span>
                <span className="hidden sm:inline">
                  Predicción guardada · editá para cambiarla
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-w3-primary sm:gap-1.5 sm:text-[13px]">
                <PencilLine className="h-3.5 w-3.5 shrink-0" />
                Cargá tu predicción
              </span>
            )}
          </>
        )}

        {!editable && !finished && !hasSaved && (
          <span className="text-xs font-medium text-w3-text-muted sm:text-[13px]">
            Sin predicción
          </span>
        )}
      </div>

      {finished && expanded && (
        <div className="mt-3 border-t border-w3-border pt-3">
          {resultsState === 'loading' && (
            <p className="text-center text-xs text-w3-text-muted">
              Cargando predicciones…
            </p>
          )}
          {resultsState === 'error' && (
            <p className="text-center text-xs text-red-400">
              No se pudieron cargar las predicciones.
            </p>
          )}
          {resultsState === 'loaded' && (
            <ResultsPanel
              results={results}
              isKnockout={isKnockout}
              match={match}
            />
          )}
        </div>
      )}

      {isLive && liveExpanded && (
        <div className="mt-3 border-t border-w3-border pt-3">
          {liveState === 'loading' && (
            <p className="text-center text-xs text-w3-text-muted">
              Cargando pronósticos…
            </p>
          )}
          {liveState === 'error' && (
            <p className="text-center text-xs text-red-400">
              No se pudieron cargar los pronósticos.
            </p>
          )}
          {liveState === 'loaded' && (
            <LivePanel data={livePreds} match={match} />
          )}
        </div>
      )}
    </div>
  );
}

type OutcomeTone = 'home' | 'draw' | 'away';

const OUTCOME_COLOR: Record<OutcomeTone, string> = {
  home: 'bg-w3-primary',
  draw: 'bg-w3-text-muted',
  away: 'bg-w3-warn',
};

function OutcomeRow({
  label,
  count,
  total,
  tone,
  leading,
}: {
  label: string;
  count: number;
  total: number;
  tone: OutcomeTone;
  leading: boolean;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5 sm:gap-3">
      <div className="flex w-24 shrink-0 items-center gap-1.5 sm:w-36">
        <span className={`h-2 w-2 shrink-0 rounded-full ${OUTCOME_COLOR[tone]}`} />
        <span
          className={`truncate text-xs font-semibold ${
            leading ? 'text-w3-white' : 'text-w3-text-secondary'
          }`}
        >
          {label}
        </span>
      </div>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-w3-score-box">
        <div
          className={`h-full rounded-full transition-all duration-500 ${OUTCOME_COLOR[tone]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-16 shrink-0 whitespace-nowrap text-right text-xs font-bold tabular-nums text-w3-white">
        {pct}%
        <span className="ml-1 font-medium text-w3-text-muted">({count})</span>
      </span>
    </div>
  );
}

function LiveGroup({
  label,
  tone,
  entries,
  match,
}: {
  label: string;
  tone: OutcomeTone;
  entries: LivePredictionEntry[];
  match: MatchView;
}) {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort(
    (a, b) =>
      b.homeScore - a.homeScore ||
      a.awayScore - b.awayScore ||
      a.user.name.localeCompare(b.user.name),
  );
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${OUTCOME_COLOR[tone]}`} />
        <span className="text-[11px] font-bold uppercase tracking-wide text-w3-text-secondary">
          {label}
        </span>
        <span className="rounded-full bg-w3-score-box px-1.5 py-0.5 text-[10px] font-semibold text-w3-text-muted">
          {entries.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sorted.map((e) => (
          <span
            key={e.user.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-w3-border bg-w3-surface py-0.5 pl-0.5 pr-2.5"
          >
            <ResultAvatar name={e.user.name} avatarUrl={e.user.avatarUrl} />
            <span className="text-xs font-semibold text-w3-white">
              {e.user.name}
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-w3-score-box px-1.5 py-0.5">
              <span className="text-[11px] font-bold tabular-nums text-w3-text-secondary">
                {e.homeScore}–{e.awayScore}
              </span>
              {e.penaltyWinner && (
                <PenaltyWinnerFlag winner={e.penaltyWinner} match={match} />
              )}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ScorelineRow({
  score,
  count,
  total,
  max,
  rank,
}: {
  score: string;
  count: number;
  total: number;
  max: number;
  rank: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const barPct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5 sm:gap-3">
      <span
        className={`grid w-14 shrink-0 place-items-center rounded-lg border py-1 text-sm font-bold tabular-nums ${
          rank === 0
            ? 'border-w3-primary-border bg-w3-primary-soft text-w3-primary'
            : 'border-w3-border bg-w3-score-box text-w3-white'
        }`}
      >
        {score}
      </span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-w3-score-box">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            rank === 0 ? 'bg-w3-primary' : 'bg-w3-primary/45'
          }`}
          style={{ width: `${barPct}%` }}
        />
      </div>
      <span className="w-16 shrink-0 whitespace-nowrap text-right text-xs font-bold tabular-nums text-w3-white">
        {pct}%
        <span className="ml-1 font-medium text-w3-text-muted">({count})</span>
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-w3-text-secondary">
      {children}
    </div>
  );
}

function LivePanel({
  data,
  match,
}: {
  data: LivePredictions | null;
  match: MatchView;
}) {
  const homeName = match.homeTeam.name;
  const awayName = match.awayTeam.name;
  const predictions = data?.predictions ?? [];
  if (predictions.length === 0) {
    return (
      <p className="text-center text-xs text-w3-text-muted">
        Todavía nadie había cargado una predicción para este partido.
      </p>
    );
  }

  const total = predictions.length;
  const homeWin = predictions.filter((p) => p.homeScore > p.awayScore);
  const draw = predictions.filter((p) => p.homeScore === p.awayScore);
  const awayWin = predictions.filter((p) => p.homeScore < p.awayScore);

  const outcomes = [
    { tone: 'home' as const, label: `Gana ${homeName}`, list: homeWin },
    { tone: 'draw' as const, label: 'Empate', list: draw },
    { tone: 'away' as const, label: `Gana ${awayName}`, list: awayWin },
  ];
  const leadingCount = Math.max(homeWin.length, draw.length, awayWin.length);
  const leader = outcomes.find((o) => o.list.length === leadingCount)!;
  const leaderPct = Math.round((leadingCount / total) * 100);

  const counts = new Map<string, number>();
  for (const p of predictions) {
    const key = `${p.homeScore}–${p.awayScore}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const topScores = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
  const maxScore = topScores[0]?.[1] ?? 0;

  return (
    <div className="space-y-4 text-left">
      {/* Resumen */}
      <p className="text-xs text-w3-text-secondary sm:text-[13px]">
        {total} {total === 1 ? 'persona pronosticó' : 'personas pronosticaron'}{' '}
        este partido.{' '}
        <span className="font-semibold text-w3-white">
          {leader.label} ({leaderPct}%)
        </span>{' '}
        es lo más elegido.
      </p>

      {/* Tendencia */}
      <div>
        <SectionTitle>Tendencia</SectionTitle>
        <div className="space-y-2">
          {outcomes.map((o) => (
            <OutcomeRow
              key={o.tone}
              label={o.label}
              count={o.list.length}
              total={total}
              tone={o.tone}
              leading={o.list.length === leadingCount}
            />
          ))}
        </div>
      </div>

      {/* Marcadores más elegidos */}
      {topScores.length > 0 && (
        <div>
          <SectionTitle>Marcadores más elegidos</SectionTitle>
          <div className="space-y-1.5">
            {topScores.slice(0, 5).map(([score, n], i) => (
              <ScorelineRow
                key={score}
                score={score}
                count={n}
                total={total}
                max={maxScore}
                rank={i}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quién puso qué */}
      <div>
        <SectionTitle>Quién puso qué</SectionTitle>
        <div className="space-y-3">
          {outcomes.map((o) => (
            <LiveGroup
              key={o.tone}
              label={o.label}
              tone={o.tone}
              entries={o.list}
              match={match}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultsPanel({
  results,
  isKnockout,
  match,
}: {
  results: MatchResults | null;
  isKnockout: boolean;
  match: MatchView;
}) {
  const predictions = results?.predictions ?? [];
  if (predictions.length === 0) {
    return (
      <p className="text-center text-xs text-w3-text-muted">
        Nadie cargó una predicción para este partido.
      </p>
    );
  }

  // El cruce se definió por penales solo si fue eliminación y terminó empatado.
  // Solo en ese caso distinguimos el bonus por acertar el ganador (+5 dorado).
  const wentToPenalties =
    isKnockout &&
    results?.homeScore != null &&
    results.homeScore === results.awayScore;

  const outcome = predictions.filter((p) => p.points === 1);
  const missed = predictions.filter((p) => p.points === 0);

  return (
    <div className="space-y-3 text-left">
      {wentToPenalties ? (
        <>
          <ResultGroup
            title="Resultado y ganador exacto · +5"
            entries={predictions.filter((p) => p.points === 5)}
            tone="gold"
            match={match}
          />
          <ResultGroup
            title="Resultado exacto · +3"
            entries={predictions.filter((p) => p.isExact && p.points !== 5)}
            tone="exact"
            match={match}
          />
        </>
      ) : (
        <ResultGroup
          title="Resultado exacto · +3"
          entries={predictions.filter((p) => p.isExact)}
          tone="exact"
          match={match}
        />
      )}
      <ResultGroup
        title="Acertaron el resultado · +1"
        entries={outcome}
        tone="outcome"
        match={match}
      />
      <ResultGroup
        title="No acertaron"
        entries={missed}
        tone="miss"
        match={match}
      />
    </div>
  );
}
