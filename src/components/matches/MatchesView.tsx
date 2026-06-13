import { ChevronDown } from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { dayKey, formatDayUpper, todayKey } from '../../lib/format';
import { getPhase, type StatusFilter } from '../../lib/matchPhase';
import type { LiveMap, MatchPrediction, MatchView } from '../../lib/types';
import MatchCard from './MatchCard';
import MatchesToolbar, { type DayTab } from './MatchesToolbar';
import ProgressCard from './ProgressCard';

function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const LIVE_WINDOW_BEFORE = 2 * 60_000;
const LIVE_WINDOW_AFTER = 3 * 60 * 60_000;

/**
 * Trae el overlay de vivo del backend (/api/live) cada 60s, pero solo cuando hay
 * algún partido en ventana de juego (kickoff -2m .. +3h). Best-effort: ante
 * error mantiene el último estado y las cards caen al modo honesto si queda vacío.
 */
function useLiveScores(matches: MatchView[], now: number): LiveMap {
  const [live, setLive] = useState<LiveMap>({});

  // Booleano estable: el intervalo solo se recrea cuando la ventana se abre/cierra.
  const hasWindow = useMemo(() => {
    return matches.some((m) => {
      if (m.status === 'FINISHED') return false;
      const k = new Date(m.kickoffAt).getTime();
      return now >= k - LIVE_WINDOW_BEFORE && now <= k + LIVE_WINDOW_AFTER;
    });
  }, [matches, now]);

  useEffect(() => {
    if (!hasWindow) {
      setLive((prev) => (Object.keys(prev).length ? {} : prev));
      return;
    }
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch('/api/live');
        if (!res.ok) return;
        const data = (await res.json()) as LiveMap;
        if (!cancelled) setLive(data);
      } catch {
        /* best-effort: dejamos el estado previo */
      }
    }
    void poll();
    const id = setInterval(() => void poll(), 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [hasWindow]);

  return live;
}

interface Props {
  matches: MatchView[];
  focusMatchId?: string | null;
}

export default function MatchesView({
  matches: initialMatches,
  focusMatchId = null,
}: Props) {
  const now = useNow();
  const [matches, setMatches] = useState(initialMatches);
  const liveById = useLiveScores(matches, now);
  const [dayTab, setDayTab] = useState<DayTab>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [focusReady, setFocusReady] = useState(!focusMatchId);
  // null = automático (abierto si hay pocos); booleano = override del usuario.
  const [showFinished, setShowFinished] = useState<boolean | null>(null);
  // Una sola vez: evita que el auto-scroll del deep link se repita en cada tick.
  const focusDoneRef = useRef(false);

  const loaded = matches.filter((m) => m.prediction != null).length;
  const total = matches.length;

  const today = todayKey();
  const todayCount = matches.filter((m) => dayKey(m.kickoffAt) === today).length;

  function handlePredictionSaved(matchId: string, prediction: MatchPrediction) {
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, prediction } : m)),
    );
  }

  const filtered = useMemo(() => {
    return matches
      .filter((m) => {
        if (dayTab === 'today' && dayKey(m.kickoffAt) !== today) return false;
        if (
          statusFilter !== 'all' &&
          getPhase(m, now, liveById[m.id] ?? null).key !== statusFilter
        )
          return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
      );
  }, [matches, dayTab, statusFilter, now, today, liveById]);

  // El en vivo siempre arriba con su sección. En "Todos" los finalizados van al
  // fondo (banda colapsable); en "Hoy" quedan en su lugar cronológico.
  const bucketFinished = dayTab === 'all';
  const { liveMatches, upcomingGroups, finishedGroups, finishedPoints } =
    useMemo(() => {
      const live: MatchView[] = [];
      const upcoming: MatchView[] = [];
      const finished: MatchView[] = [];
      for (const m of filtered) {
        const key = getPhase(m, now, liveById[m.id] ?? null).key;
        if (key === 'live') live.push(m);
        else if (key === 'finished' && bucketFinished) finished.push(m);
        else upcoming.push(m);
      }
      const points = finished.reduce(
        (sum, m) => sum + (m.prediction?.pointsAwarded ?? 0),
        0,
      );
      return {
        liveMatches: live,
        upcomingGroups: groupByDay(upcoming, 'asc'),
        finishedGroups: groupByDay(finished, 'desc'),
        finishedPoints: points,
      };
    }, [filtered, now, bucketFinished, liveById]);

  const finishedCount = finishedGroups.reduce(
    (n, [, arr]) => n + arr.length,
    0,
  );
  const finishedOpen =
    showFinished ?? (statusFilter === 'finished' || finishedCount <= 3);
  // Si no hay nada arriba (en vivo/próximos), el colapsable no aporta: mostramos
  // los finalizados directo, sin header.
  const finishedIsOnlyContent =
    liveMatches.length === 0 && upcomingGroups.length === 0;

  // Asegura que el partido del deep link sea visible (sin filtros activos).
  useEffect(() => {
    if (!focusMatchId || focusReady) return;
    const exists = matches.some((m) => m.id === focusMatchId);
    if (!exists) {
      setFocusReady(true);
      return;
    }
    setDayTab('all');
    setStatusFilter('all');
    setFocusReady(true);
  }, [focusMatchId, focusReady, matches]);

  useEffect(() => {
    if (focusDoneRef.current) return;
    if (!focusMatchId || !focusReady) return;
    if (!matches.some((m) => m.id === focusMatchId)) return;
    if (!filtered.some((m) => m.id === focusMatchId)) return;

    const scrollTimer = window.setTimeout(() => {
      const el = document.getElementById(`match-${focusMatchId}`);
      // El partido puede estar en una sección colapsada que aún no montó;
      // reintentamos en el próximo ciclo hasta que el elemento exista.
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightId(focusMatchId);
      focusDoneRef.current = true;

      const url = new URL(window.location.href);
      url.searchParams.delete('partido');
      window.history.replaceState({}, '', url.toString());

      window.setTimeout(() => setHighlightId(null), 2800);
    }, 80);

    return () => window.clearTimeout(scrollTimer);
  }, [focusMatchId, focusReady, filtered, matches]);

  // Si el deep link apunta a un partido finalizado, abrir la sección.
  useEffect(() => {
    if (!focusMatchId) return;
    const target = matches.find((m) => m.id === focusMatchId);
    if (target?.status === 'FINISHED') setShowFinished(true);
  }, [focusMatchId, matches]);

  if (matches.length === 0) {
    return (
      <p className="rounded-w3-card border border-w3-border bg-w3-surface p-6 text-center text-w3-text-secondary">
        Todavía no hay partidos cargados. Volvé más tarde.
      </p>
    );
  }

  const finishedSections = finishedGroups.map(([key, dayMatches]) => (
    <section key={key}>
      <DayHeader label={formatDayUpper(dayMatches[0].kickoffAt)} />
      <div className="space-y-2.5 sm:space-y-3.5">
        {dayMatches.map((m) => (
          <MatchCardSlot
            key={m.id}
            matchId={m.id}
            highlighted={highlightId === m.id}
          >
            <MatchCard
              match={m}
              now={now}
              live={liveById[m.id] ?? null}
              onPredictionSaved={handlePredictionSaved}
            />
          </MatchCardSlot>
        ))}
      </div>
    </section>
  ));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-[34px]">
            Partidos
          </h1>
          <p className="mt-1.5 text-sm text-w3-text-secondary sm:text-[15px]">
            Cargá tu predicción hasta 15 minutos antes de cada partido
          </p>
        </div>
        <ProgressCard loaded={loaded} total={total} />
      </div>

      <MatchesToolbar
        dayTab={dayTab}
        onDayTabChange={setDayTab}
        todayCount={todayCount}
        allCount={total}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {filtered.length === 0 ? (
        <p className="rounded-w3-card border border-w3-border bg-w3-surface p-6 text-center text-w3-text-secondary">
          No hay partidos con estos filtros.
        </p>
      ) : (
        <div className="space-y-5 sm:space-y-8">
          {liveMatches.length > 0 && (
            <section>
              <DayHeader live />
              <div className="space-y-2.5 sm:space-y-3.5">
                {liveMatches.map((m) => (
                  <MatchCardSlot
                    key={m.id}
                    matchId={m.id}
                    highlighted={highlightId === m.id}
                  >
                    <MatchCard
                      match={m}
                      now={now}
                      live={liveById[m.id] ?? null}
                      onPredictionSaved={handlePredictionSaved}
                    />
                  </MatchCardSlot>
                ))}
              </div>
            </section>
          )}

          {upcomingGroups.map(([key, dayMatches]) => (
            <section key={key}>
              <DayHeader label={formatDayUpper(dayMatches[0].kickoffAt)} />
              <div className="space-y-2.5 sm:space-y-3.5">
                {dayMatches.map((m) => (
                  <MatchCardSlot
                    key={m.id}
                    matchId={m.id}
                    highlighted={highlightId === m.id}
                  >
                    <MatchCard
                      match={m}
                      now={now}
                      live={liveById[m.id] ?? null}
                      onPredictionSaved={handlePredictionSaved}
                    />
                  </MatchCardSlot>
                ))}
              </div>
            </section>
          ))}

          {finishedCount > 0 &&
            (finishedIsOnlyContent ? (
              finishedSections
            ) : (
              <section>
                <button
                  type="button"
                  onClick={() => setShowFinished(!finishedOpen)}
                  aria-expanded={finishedOpen}
                  className="flex w-full items-center justify-between gap-3 rounded-w3-sm border border-w3-border bg-w3-surface px-4 py-3 text-left transition-colors hover:border-w3-border-strong"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-bold text-w3-text-secondary">
                      Finalizados
                    </span>
                    <span className="rounded-full bg-w3-score-box px-2 py-0.5 text-xs font-semibold text-w3-text-muted">
                      {finishedCount}
                    </span>
                  </span>
                  <span className="flex items-center gap-2.5">
                    {finishedPoints > 0 && (
                      <span className="text-[13px] font-medium text-w3-text-secondary">
                        Sumaste{' '}
                        <span className="font-bold text-w3-primary">
                          {finishedPoints}
                        </span>{' '}
                        pts
                      </span>
                    )}
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-w3-text-muted transition-transform ${
                        finishedOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </span>
                </button>

                {finishedOpen && (
                  <div className="mt-4 space-y-5 sm:mt-5 sm:space-y-8">
                    {finishedSections}
                  </div>
                )}
              </section>
            ))}
        </div>
      )}
    </div>
  );
}

/**
 * Agrupa por día. `filtered` ya viene ordenado ascendente por kickoff, así que
 * para 'desc' invertimos el orden de los días y de los partidos dentro de cada
 * uno (más reciente primero).
 */
function groupByDay(
  list: MatchView[],
  dir: 'asc' | 'desc',
): [string, MatchView[]][] {
  const map = new Map<string, MatchView[]>();
  for (const m of list) {
    const key = dayKey(m.kickoffAt);
    const arr = map.get(key) ?? [];
    arr.push(m);
    map.set(key, arr);
  }
  const entries = [...map.entries()].sort(([a], [b]) =>
    dir === 'asc' ? a.localeCompare(b) : b.localeCompare(a),
  );
  if (dir === 'desc') {
    for (const [, arr] of entries) arr.reverse();
  }
  return entries;
}

function MatchCardSlot({
  matchId,
  highlighted,
  children,
}: {
  matchId: string;
  highlighted: boolean;
  children: ReactNode;
}) {
  return (
    <div
      id={`match-${matchId}`}
      className={`scroll-mt-24 rounded-2xl transition-shadow duration-500 sm:scroll-mt-28 sm:rounded-w3-card ${
        highlighted
          ? 'ring-2 ring-w3-primary ring-offset-2 ring-offset-w3-black'
          : ''
      }`}
    >
      {children}
    </div>
  );
}

function DayHeader({ live, label }: { live?: boolean; label?: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-2 sm:mb-3.5 sm:gap-2.5">
      {live ? (
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-w3-live-border bg-w3-live-soft px-2 py-0.5 text-[11px] font-bold tracking-wide text-w3-live sm:px-2.5 sm:py-1 sm:text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-w3-live opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-w3-live" />
          </span>
          EN VIVO
        </span>
      ) : (
        <span className="shrink-0 text-[10px] font-bold tracking-wide text-w3-primary sm:text-[13px]">
          {label}
        </span>
      )}
      <div className="h-px min-w-4 flex-1 bg-w3-border" />
    </div>
  );
}
