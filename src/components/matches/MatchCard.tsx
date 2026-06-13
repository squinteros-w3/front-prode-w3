import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lock,
  PencilLine,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatKickoff, formatKickoffCompact } from '../../lib/format';
import { getPhase, stageLabel, type PhaseInfo } from '../../lib/matchPhase';
import type {
  LiveGoal,
  LiveState,
  MatchPrediction,
  MatchView,
} from '../../lib/types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function goalMinute(g: LiveGoal): string {
  if (g.minute == null) return '';
  return g.addedMinute ? `${g.minute}+${g.addedMinute}'` : `${g.minute}'`;
}

function goalNote(g: LiveGoal): string {
  if (g.ownGoal) return ' (e/c)';
  if (g.penalty) return ' (p)';
  return '';
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
  live = false,
}: {
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
  highlight: boolean;
  live?: boolean;
}) {
  const num = value === '' ? null : Number(value);

  function step(delta: number) {
    const current = num ?? 0;
    const next = Math.max(0, Math.min(99, current + delta));
    onChange(String(next));
  }

  const boxClass = live
    ? 'border-w3-live/50 bg-w3-live-soft'
    : highlight
      ? 'border-w3-primary-border bg-w3-primary-soft'
      : 'border-w3-border-strong bg-w3-score-box';

  if (!editable) {
    return (
      <div
        className={`flex w-14 flex-col items-center justify-center rounded-xl border py-1.5 sm:w-[60px] sm:py-2 ${boxClass}`}
      >
        <span
          className={`font-display text-xl font-bold tabular-nums sm:text-[26px] ${live ? 'text-w3-live' : 'text-w3-white'}`}
        >
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
  };
}

export default function MatchCard({
  match,
  now,
  live = null,
  onPredictionSaved,
}: {
  match: MatchView;
  now: number;
  live?: LiveState | null;
  onPredictionSaved?: (matchId: string, prediction: MatchPrediction) => void;
}) {
  const initial = scoresFromPrediction(match.prediction);

  const [home, setHome] = useState(initial.home);
  const [away, setAway] = useState(initial.away);
  const [savedHome, setSavedHome] = useState(initial.home);
  const [savedAway, setSavedAway] = useState(initial.away);
  const [state, setState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = scoresFromPrediction(match.prediction);
    setHome(next.home);
    setAway(next.away);
    setSavedHome(next.home);
    setSavedAway(next.away);
  }, [match.id, match.prediction?.homeScore, match.prediction?.awayScore]);

  const editable = !match.locked && match.status === 'SCHEDULED';
  const finished = match.status === 'FINISHED';
  const phase = getPhase(match, now, live);
  // Marcador real en juego: solo mientras el backend no oficializó el resultado.
  const showLive = live != null && !finished;

  const hasSaved = savedHome !== '' && savedAway !== '';
  const bothFilled = home !== '' && away !== '';
  const changed = home !== savedHome || away !== savedAway;
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

  // Casilleros grandes: en edición, lo que cargás; EN VIVO, el marcador REAL
  // (tu predicción pasa al footer); en finalizados/cerrados, tu pronóstico.
  const displayHome = editable
    ? home
    : showLive && live
      ? String(live.homeScore)
      : savedHome;
  const displayAway = editable
    ? away
    : showLive && live
      ? String(live.awayScore)
      : savedAway;

  async function save() {
    const h = Number(home);
    const a = Number(away);
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) {
      setError('Cargá ambos marcadores (0 o más).');
      setState('error');
      return;
    }
    setState('saving');
    setError(null);
    try {
      const res = await fetch(`/api/predictions/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeScore: h, awayScore: a }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? 'No se pudo guardar');
      }
      const data = await res.json();
      const prediction: MatchPrediction = {
        homeScore: data.homeScore ?? h,
        awayScore: data.awayScore ?? a,
        pointsAwarded: data.pointsAwarded ?? 0,
        isExact: data.isExact ?? false,
      };
      setSavedHome(home);
      setSavedAway(away);
      setState('saved');
      onPredictionSaved?.(match.id, prediction);
    } catch (e) {
      setError((e as Error).message);
      setState('error');
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

  const points = match.prediction?.pointsAwarded ?? 0;

  return (
    <div
      className={`rounded-2xl border px-3.5 py-3 transition-colors sm:rounded-w3-card sm:px-[22px] sm:py-[18px] ${cardBorder} ${cardBg} ${
        phase.key === 'live' ? 'ring-1 ring-w3-live/30' : ''
      }`}
    >
      {/* Meta: siempre una sola fila */}
      <div className="mb-2.5 flex items-center justify-between gap-2 sm:mb-4">
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden sm:gap-2.5">
          {match.group ? (
            <a
              href={`/grupos?grupo=${match.group}`}
              title={`Ver el Grupo ${match.group}`}
              className="shrink-0 cursor-pointer rounded-md border border-w3-border bg-w3-surface-muted px-1.5 py-0.5 text-[11px] font-semibold text-w3-text-secondary transition-colors hover:border-w3-primary-border hover:text-w3-primary sm:rounded-lg sm:px-2 sm:text-xs"
            >
              {stageLabel(match)}
            </a>
          ) : (
            <span className="shrink-0 rounded-md border border-w3-border bg-w3-surface-muted px-1.5 py-0.5 text-[11px] font-semibold text-w3-text-secondary sm:rounded-lg sm:px-2 sm:text-xs">
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
            live={showLive}
          />
          <span className="font-display text-base font-bold text-w3-text-muted sm:text-[22px]">
            :
          </span>
          <ScoreStepper
            value={displayAway}
            onChange={handleAway}
            editable={editable}
            highlight={openNoPrediction}
            live={showLive}
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

      {/* Goleadores en vivo, alineados a cada equipo. */}
      {showLive && live && live.goals.length > 0 && (
        <div className="mt-2.5 grid grid-cols-2 gap-x-3 border-t border-w3-border/60 pt-2 text-[11px] leading-tight text-w3-text-secondary sm:text-xs">
          <div className="space-y-0.5">
            {live.goals
              .filter((g) => g.team === 'home')
              .map((g, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="shrink-0 text-w3-text-muted">⚽</span>
                  <span className="truncate">
                    {g.player}
                    {goalNote(g)}
                  </span>
                  <span className="shrink-0 tabular-nums text-w3-text-muted">
                    {goalMinute(g)}
                  </span>
                </div>
              ))}
          </div>
          <div className="space-y-0.5 text-right">
            {live.goals
              .filter((g) => g.team === 'away')
              .map((g, i) => (
                <div key={i} className="flex items-center justify-end gap-1">
                  <span className="shrink-0 tabular-nums text-w3-text-muted">
                    {goalMinute(g)}
                  </span>
                  <span className="truncate">
                    {g.player}
                    {goalNote(g)}
                  </span>
                  <span className="shrink-0 text-w3-text-muted">⚽</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Footer compacto en mobile */}
      <div className="mt-2 flex min-h-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-1.5 text-center sm:min-h-[34px] sm:pt-2">
        {/* EN VIVO: el resultado real está en los casilleros de arriba; acá
            mostramos TU predicción con la misma jerarquía para comparar. */}
        {showLive && (
          <span className="inline-flex items-center gap-2 rounded-full border border-w3-border bg-w3-surface-muted px-3 py-1 sm:gap-2.5 sm:px-3.5 sm:py-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-w3-text-muted sm:text-[11px]">
              Tu predicción
            </span>
            {hasSaved ? (
              <span className="font-display text-lg font-extrabold tabular-nums leading-none text-w3-text-secondary sm:text-xl">
                {savedHome}–{savedAway}
              </span>
            ) : (
              <span className="text-xs font-semibold text-w3-text-muted sm:text-[13px]">
                sin cargar
              </span>
            )}
          </span>
        )}

        {finished && (
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-xs font-medium text-w3-text-secondary sm:text-[13px]">
              <span className="sm:hidden">
                Real {match.homeScore}–{match.awayScore}
              </span>
              <span className="hidden sm:inline">
                Resultado real: {match.homeScore}–{match.awayScore}
              </span>
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold sm:text-xs ${
                points === 3
                  ? 'bg-w3-primary text-w3-black'
                  : points === 1
                    ? 'bg-w3-primary-soft text-w3-primary'
                    : 'bg-w3-score-box text-w3-text-muted'
              }`}
            >
              {points > 0 && <Check className="h-3 w-3" />}
              {points === 3
                ? '¡Exacto! +3'
                : points === 1
                  ? '+1'
                  : '+0'}
            </span>
          </div>
        )}

        {lockedWithPrediction && !finished && !showLive && (
          <span className="inline-flex items-center gap-1 rounded-full border border-w3-border bg-w3-surface-muted px-2 py-0.5 text-xs font-semibold text-w3-text-secondary sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[13px]">
            <Lock className="h-3 w-3 text-w3-text-muted" />
            <span className="sm:hidden">Pronóstico cerrado</span>
            <span className="hidden sm:inline">Tu pronóstico está cerrado</span>
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

        {!editable && !finished && !hasSaved && !showLive && (
          <span className="text-xs font-medium text-w3-text-muted sm:text-[13px]">
            Sin predicción
          </span>
        )}
      </div>
    </div>
  );
}
