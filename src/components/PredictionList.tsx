import React, { useEffect, useMemo, useState } from 'react';
import { dayKey, formatDay, formatKickoff } from '../lib/format';
import type { MatchView } from '../lib/types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

type MatchPhase = 'open' | 'upcoming' | 'live' | 'finished';

interface PhaseInfo {
  key: MatchPhase;
  label: string;
  hint: string;
  chipClass: string;
  dotClass: string;
  pulse: boolean;
}

/**
 * Deriva el estado "real" del partido combinando el status del backend
 * (SCHEDULED/FINISHED) con el lock de predicciones y el horario de kickoff.
 * `now` se pasa desde un reloj cliente para que "En vivo" aparezca solo.
 */
function getPhase(match: MatchView, now: number): PhaseInfo {
  if (match.status === 'FINISHED') {
    return {
      key: 'finished',
      label: 'Partido Finalizado',
      hint: 'El partido terminó',
      chipClass: 'bg-white/10 text-white/60',
      dotClass: 'bg-white/40',
      pulse: false,
    };
  }

  const kickoff = new Date(match.kickoffAt).getTime();
  if (match.locked && now >= kickoff) {
    return {
      key: 'live',
      label: 'En Juego',
      hint: 'Jugándose ahora',
      chipClass: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
      dotClass: 'bg-red-500',
      pulse: true,
    };
  }

  if (match.locked) {
    return {
      key: 'upcoming',
      label: 'Por comenzar',
      hint: 'Predicciones cerradas · el partido está por empezar',
      chipClass: 'bg-amber-400/15 text-amber-300',
      dotClass: 'bg-amber-400',
      pulse: false,
    };
  }

  return {
    key: 'open',
    label: 'Abierto',
    hint: 'Podés cargar o editar tu predicción',
    chipClass: 'bg-w3-primary/15 text-w3-primary',
    dotClass: 'bg-w3-primary',
    pulse: false,
  };
}

function StatusChip({ phase }: { phase: PhaseInfo }) {
  return (
    <span
      title={phase.hint}
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium ${phase.chipClass}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {phase.pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${phase.dotClass}`}
          />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${phase.dotClass}`}
        />
      </span>
      {phase.label}
    </span>
  );
}

/** Reloj cliente liviano: tick cada 30s, sin polling al servidor. */
function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const STAGE_LABELS: Record<string, string> = {
  r32: '32avos',
  r16: 'Octavos',
  qf: 'Cuartos',
  sf: 'Semifinal',
  third: '3er puesto',
  final: 'Final',
};

function stageLabel(match: { group: string | null; stage: string }): string {
  if (match.group) return `Grupo ${match.group}`;
  return STAGE_LABELS[match.stage] ?? match.stage;
}

function TeamLabel({
  name,
  code,
  flagUrl,
  align,
}: {
  name: string;
  code: string | null;
  flagUrl: string | null;
  align: 'left' | 'right';
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 ${
        align === 'right' ? 'flex-row-reverse text-right' : ''
      }`}
    >
      {flagUrl ? (
        <img
          src={flagUrl}
          alt=""
          className="h-5 w-7 shrink-0 rounded-sm object-cover ring-1 ring-white/10"
        />
      ) : (
        <span className="h-5 w-7 shrink-0 rounded-sm bg-white/10" />
      )}
      <span className="truncate text-sm font-medium sm:text-base">
        <span className="sm:hidden">{code ?? name}</span>
        <span className="hidden sm:inline">{name}</span>
      </span>
    </div>
  );
}

function MatchCard({ match, now }: { match: MatchView; now: number }) {
  const initialHome = match.prediction ? String(match.prediction.homeScore) : '';
  const initialAway = match.prediction ? String(match.prediction.awayScore) : '';

  const [home, setHome] = useState(initialHome);
  const [away, setAway] = useState(initialAway);
  // Lo que está realmente guardado en el servidor (para detectar cambios).
  const [savedHome, setSavedHome] = useState(initialHome);
  const [savedAway, setSavedAway] = useState(initialAway);
  const [state, setState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);

  const editable = !match.locked && match.status === 'SCHEDULED';
  const finished = match.status === 'FINISHED';
  const phase = getPhase(match, now);

  const hasSaved = savedHome !== '' && savedAway !== '';
  const bothFilled = home !== '' && away !== '';
  const changed = home !== savedHome || away !== savedAway;
  const dirty = editable && bothFilled && changed;
  // El botón aparece solo cuando hay algo para guardar (o mientras da feedback).
  const showButton =
    editable && (dirty || state === 'saving' || state === 'saved' || state === 'error');

  function handleHome(v: string) {
    setHome(v);
    if (state !== 'idle') setState('idle');
  }
  function handleAway(v: string) {
    setAway(v);
    if (state !== 'idle') setState('idle');
  }

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
      setSavedHome(home);
      setSavedAway(away);
      setState('saved');
    } catch (e) {
      setError((e as Error).message);
      setState('error');
    }
  }

  const points = match.prediction?.pointsAwarded ?? 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-white/20 sm:p-4">
      <div className="mb-2 flex items-center justify-between text-xs text-white/50">
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-white/5 px-2 py-0.5 font-medium text-white/70">
            {stageLabel(match)}
          </span>
          <span>{formatKickoff(match.kickoffAt)} hs</span>
        </span>
        <StatusChip phase={phase} />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
        <TeamLabel
          name={match.homeTeam.name}
          code={match.homeTeam.code}
          flagUrl={match.homeTeam.flagUrl}
          align="left"
        />

        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <ScoreBox
            value={home}
            onChange={handleHome}
            editable={editable}
            placeholder="-"
          />
          <span className="text-xl font-bold text-white/30">:</span>
          <ScoreBox
            value={away}
            onChange={handleAway}
            editable={editable}
            placeholder="-"
          />
        </div>

        <TeamLabel
          name={match.awayTeam.name}
          code={match.awayTeam.code}
          flagUrl={match.awayTeam.flagUrl}
          align="right"
        />
      </div>

      {finished && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs">
          <span className="text-white/50">
            Resultado real: {match.homeScore}–{match.awayScore}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 font-semibold ${
              points === 3
                ? 'bg-w3-primary text-w3-black'
                : points === 1
                  ? 'bg-w3-primary/20 text-w3-primary'
                  : 'bg-white/10 text-white/50'
            }`}
          >
            {points === 3 ? '¡Exacto! +3' : points === 1 ? '+1' : '+0'}
          </span>
        </div>
      )}

      {editable && (
        <div className="mt-3 flex min-h-[34px] items-center justify-end gap-3">
          {error && state === 'error' && (
            <span className="text-xs text-red-400">{error}</span>
          )}

          {state === 'saved' && !dirty ? (
            <span className="text-sm font-medium text-w3-primary">
              ✓ Guardado
            </span>
          ) : !showButton && hasSaved ? (
            <span className="text-xs text-white/40">
              Predicción guardada · editá para cambiarla
            </span>
          ) : showButton ? (
            <button
              onClick={save}
              disabled={state === 'saving'}
              className="rounded-lg bg-w3-primary px-4 py-1.5 text-sm font-semibold text-w3-black transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {state === 'saving'
                ? 'Guardando…'
                : hasSaved
                  ? 'Actualizar'
                  : 'Guardar'}
            </button>
          ) : (
            <span className="text-xs text-white/40">
              Cargá tu predicción
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreBox({
  value,
  onChange,
  editable,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
  placeholder: string;
}) {
  if (!editable) {
    return (
      <span className="grid h-14 w-14 place-items-center rounded-xl bg-white/5 text-2xl font-bold tabular-nums sm:h-16 sm:w-16">
        {value === '' ? placeholder : value}
      </span>
    );
  }
  return (
    <input
      type="number"
      min={0}
      max={99}
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value.slice(0, 2))}
      placeholder={placeholder}
      className="h-14 w-14 rounded-xl border border-white/15 bg-w3-black text-center text-2xl font-bold tabular-nums outline-none transition-colors [appearance:textfield] focus:border-w3-primary focus:ring-2 focus:ring-w3-primary/40 sm:h-16 sm:w-16 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
  );
}

export default function PredictionList({ matches }: { matches: MatchView[] }) {
  const now = useNow();
  const groups = useMemo(() => {
    const map = new Map<string, MatchView[]>();
    for (const m of matches) {
      const key = dayKey(m.kickoffAt);
      const arr = map.get(key) ?? [];
      arr.push(m);
      map.set(key, arr);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [matches]);

  if (matches.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-white/50">
        Todavía no hay partidos cargados. Volvé más tarde.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map(([key, dayMatches]) => (
        <section key={key}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-w3-primary">
            {formatDay(dayMatches[0].kickoffAt)}
          </h2>
          <div className="space-y-3">
            {dayMatches.map((m) => (
              <MatchCard key={m.id} match={m} now={now} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
