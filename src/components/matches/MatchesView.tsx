import { Check, ChevronDown, PencilLine } from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { dayKey, formatDayUpper, todayKey } from '../../lib/format';
import { getPhase } from '../../lib/matchPhase';
import type { BracketMatch, MatchPrediction, MatchView } from '../../lib/types';
import FilterChip from './FilterChip';
import MatchCard from './MatchCard';
import MatchesToolbar, { type DayTab } from './MatchesToolbar';
import PhaseTabs, { type MatchPhaseTab } from './PhaseTabs';
import ProgressCard from './ProgressCard';

/** Vista unificada de ambas fases, por encima de la selección de fase. */
type CrossFilter = 'none' | 'pending' | 'finished';

function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

interface Props {
  matches: MatchView[];
  bracket?: BracketMatch[];
  focusMatchId?: string | null;
}

export default function MatchesView({
  matches: initialMatches,
  bracket = [],
  focusMatchId = null,
}: Props) {
  const now = useNow();
  const [matches, setMatches] = useState(initialMatches);
  // Por defecto mostramos Eliminatorias si ya hay cruces cargados; si todavía
  // no existen (fase de grupos en curso) arranca en Grupos.
  const [phase, setPhase] = useState<MatchPhaseTab>(() =>
    initialMatches.some((m) => m.stage !== 'group') ? 'knockout' : 'group',
  );
  const [dayTab, setDayTab] = useState<DayTab>('all');
  // Vista unificada (ambas fases juntas) por encima de la selección de fase.
  const [crossFilter, setCrossFilter] = useState<CrossFilter>('none');
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [focusReady, setFocusReady] = useState(!focusMatchId);
  // null = automático (abierto si hay pocos); booleano = override del usuario.
  const [showFinished, setShowFinished] = useState<boolean | null>(null);
  // Una sola vez: evita que el auto-scroll del deep link se repita en cada tick.
  const focusDoneRef = useRef(false);

  // La fase de grupos y la eliminatoria se separan por el stage del partido.
  const groupMatches = useMemo(
    () => matches.filter((m) => m.stage === 'group'),
    [matches],
  );
  const knockoutMatches = useMemo(
    () => matches.filter((m) => m.stage !== 'group'),
    [matches],
  );

  const isKnockout = phase === 'knockout';
  const activeMatches = isKnockout ? knockoutMatches : groupMatches;

  // "Tu progreso", "Por cargar" y "Finalizados" son globales: cuentan grupos y
  // eliminatoria juntos (todo el torneo).
  const loaded = matches.filter((m) => m.prediction != null).length;
  const total = matches.length;
  const pendingTotal = matches.filter(isLoadable).length;
  const finishedTotal = matches.filter(
    (m) => getPhase(m, now).key === 'finished',
  ).length;

  // El segmentado Hoy/Todos filtra la lista de la fase activa. Cuenta los
  // partidos cargables de la fase (en eliminatoria, los cruces ya definidos).
  const phaseAllCount = activeMatches.length;

  const today = todayKey();
  const todayCount = activeMatches.filter(
    (m) => dayKey(m.kickoffAt) === today,
  ).length;

  function handlePredictionSaved(matchId: string, prediction: MatchPrediction) {
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, prediction } : m)),
    );
  }

  // Toggle de la vista unificada: clic en la activa vuelve a la fase normal.
  function toggleCross(value: CrossFilter) {
    setCrossFilter((cur) => (cur === value ? 'none' : value));
  }

  // Lista de la fase activa (grupos o eliminatoria) ordenada cronológicamente.
  // En eliminatoria solo entran los cruces ya definidos (los que existen como
  // partido cargable); los placeholders "a definir" viven en el cuadro
  // (/eliminatoria), no acá.
  const filtered = useMemo(() => {
    return activeMatches
      .filter((m) => {
        if (dayTab === 'today' && dayKey(m.kickoffAt) !== today) return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
      );
  }, [activeMatches, dayTab, today]);

  // Lista unificada (grupos + eliminatoria) para las vistas "Por cargar" y
  // "Finalizados". Pendientes en orden cronológico; finalizados, más reciente
  // primero.
  const unifiedDays = useMemo(() => {
    if (crossFilter === 'none') return [];
    const list = matches.filter((m) =>
      crossFilter === 'pending'
        ? isLoadable(m)
        : getPhase(m, now).key === 'finished',
    );
    return groupByDay(list, crossFilter === 'pending' ? 'asc' : 'desc');
  }, [matches, crossFilter, now]);

  // El en vivo siempre arriba con su sección. En "Todos" los finalizados van al
  // fondo (banda colapsable); en "Hoy" quedan en su lugar cronológico.
  const bucketFinished = dayTab === 'all';
  const { liveMatches, upcomingGroups, finishedGroups, finishedPoints } =
    useMemo(() => {
      const live: MatchView[] = [];
      const upcoming: MatchView[] = [];
      const finished: MatchView[] = [];
      for (const m of filtered) {
        const key = getPhase(m, now).key;
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
    }, [filtered, now, bucketFinished]);

  const finishedCount = finishedGroups.reduce(
    (n, [, arr]) => n + arr.length,
    0,
  );
  const finishedOpen = showFinished ?? finishedCount <= 3;
  // Si no hay nada arriba (en vivo/próximos), el colapsable no aporta: mostramos
  // los finalizados directo, sin header.
  const finishedIsOnlyContent =
    liveMatches.length === 0 && upcomingGroups.length === 0;

  // Asegura que el partido del deep link sea visible (sin filtros activos).
  // El parámetro puede venir como id interno o externalId (p. ej. desde el
  // cuadro de la eliminatoria, que sólo conoce el externalId).
  useEffect(() => {
    if (!focusMatchId || focusReady) return;
    const target = matches.find(
      (m) => m.id === focusMatchId || m.externalId === focusMatchId,
    );
    if (!target) {
      setFocusReady(true);
      return;
    }
    // Saltamos a la fase correcta según el stage del partido enlazado.
    setPhase(target.stage === 'group' ? 'group' : 'knockout');
    setDayTab('all');
    setCrossFilter('none');
    setFocusReady(true);
  }, [focusMatchId, focusReady, matches]);

  useEffect(() => {
    if (focusDoneRef.current) return;
    if (!focusMatchId || !focusReady) return;
    const target = matches.find(
      (m) => m.id === focusMatchId || m.externalId === focusMatchId,
    );
    if (!target) return;
    // Ambas fases usan la misma lista cronológica: el partido tiene que estar
    // en la lista filtrada de la fase activa para poder hacerle scroll.
    const visible = filtered.some((m) => m.id === target.id);
    if (!visible) return;

    const scrollTimer = window.setTimeout(() => {
      const el = document.getElementById(`match-${target.id}`);
      // El partido puede estar en una sección colapsada que aún no montó;
      // reintentamos en el próximo ciclo hasta que el elemento exista.
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightId(target.id);
      focusDoneRef.current = true;

      const url = new URL(window.location.href);
      url.searchParams.delete('partido');
      window.history.replaceState({}, '', url.toString());

      window.setTimeout(() => setHighlightId(null), 2800);
    }, 80);

    return () => window.clearTimeout(scrollTimer);
  }, [focusMatchId, focusReady, filtered, matches, phase]);

  // Si el deep link apunta a un partido finalizado, abrir la sección.
  useEffect(() => {
    if (!focusMatchId) return;
    const target = matches.find(
      (m) => m.id === focusMatchId || m.externalId === focusMatchId,
    );
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
      <DayHeader
        label={formatDayUpper(dayMatches[0].kickoffAt)}
        counter={dayCounter(dayMatches)}
      />
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-[34px]">
            Partidos
          </h1>
          <p className="mt-1.5 text-sm text-w3-text-secondary sm:text-[15px]">
            {crossFilter === 'pending' ? (
              'Todos los partidos que todavía podés cargar — grupos y eliminatoria'
            ) : crossFilter === 'finished' ? (
              'Resultados de los partidos ya jugados — grupos y eliminatoria'
            ) : phase === 'knockout' ? (
              <>
                Eliminación directa.{' '}
                <a
                  href="/puntajes#cruces"
                  className="font-medium text-w3-primary underline-offset-2 hover:underline"
                >
                  ¿Dudas de cómo se puntúa un cruce con penales?
                </a>
              </>
            ) : (
              'Cargá tu predicción hasta 15 minutos antes de cada partido'
            )}
          </p>
        </div>
        <ProgressCard loaded={loaded} total={total} pending={pendingTotal} />
      </div>

      {/* Selección de fase + vistas unificadas (ambas fases juntas) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PhaseTabs
          active={crossFilter === 'none' ? phase : null}
          onChange={(p) => {
            setPhase(p);
            setCrossFilter('none');
          }}
          groupCount={groupMatches.length}
          knockoutCount={bracket.length || knockoutMatches.length}
        />
        <div className="flex w-full gap-2 sm:w-auto sm:gap-2.5">
          <FilterChip
            label="Por cargar"
            count={pendingTotal}
            active={crossFilter === 'pending'}
            tone="warn"
            icon={<PencilLine className="h-4 w-4 shrink-0" />}
            onClick={() => toggleCross('pending')}
            className="flex-1 sm:flex-none"
          />
          <FilterChip
            label="Partidos Finalizados"
            shortLabel="Finalizados"
            count={finishedTotal}
            active={crossFilter === 'finished'}
            tone="muted"
            onClick={() => toggleCross('finished')}
            className="flex-1 sm:flex-none"
          />
        </div>
      </div>

      {crossFilter !== 'none' ? (
        unifiedDays.length === 0 ? (
          <p className="rounded-w3-card border border-w3-border bg-w3-surface p-6 text-center text-w3-text-secondary">
            {crossFilter === 'pending'
              ? '¡Listo! No te queda ningún partido por cargar.'
              : 'Todavía no hay partidos finalizados.'}
          </p>
        ) : (
          <div className="space-y-5 sm:space-y-8">
            {unifiedDays.map(([key, dayMatches]) => (
              <section key={key}>
                <DayHeader
                  label={formatDayUpper(dayMatches[0].kickoffAt)}
                  counter={
                    crossFilter === 'pending'
                      ? dayCounter(dayMatches)
                      : undefined
                  }
                />
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
                        onPredictionSaved={handlePredictionSaved}
                      />
                    </MatchCardSlot>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )
      ) : (
        <>
          <MatchesToolbar
            variant={isKnockout ? 'knockout' : 'group'}
            dayTab={dayTab}
            onDayTabChange={setDayTab}
            todayCount={todayCount}
            allCount={phaseAllCount}
          />
          {filtered.length === 0 ? (
            <p className="rounded-w3-card border border-w3-border bg-w3-surface p-6 text-center text-w3-text-secondary">
              No hay partidos con estos filtros.
            </p>
          ) : (
            <div className="space-y-5 sm:space-y-8">
          {liveMatches.length > 0 && (
            <section>
              <DayHeader live counter={dayCounter(liveMatches)} />
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
                      onPredictionSaved={handlePredictionSaved}
                    />
                  </MatchCardSlot>
                ))}
              </div>
            </section>
          )}

          {upcomingGroups.map(([key, dayMatches]) => (
            <section key={key}>
              <DayHeader
                label={formatDayUpper(dayMatches[0].kickoffAt)}
                counter={dayCounter(dayMatches)}
              />
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
        </>
      )}
    </div>
  );
}

/** Un partido se puede pronosticar si está abierto y todavía no tiene carga. */
function isLoadable(m: MatchView): boolean {
  return !m.locked && m.status === 'SCHEDULED' && m.prediction == null;
}

type DayCounter = { tone: 'primary' | 'warn'; text: string };

/** Resume el estado de carga de un grupo de partidos para el chip del header. */
function dayCounter(list: MatchView[]): DayCounter {
  const toLoad = list.filter(isLoadable).length;
  if (toLoad > 0) return { tone: 'warn', text: `${toLoad} por cargar` };
  return { tone: 'primary', text: 'Al día' };
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

function DayHeader({
  live,
  label,
  counter,
}: {
  live?: boolean;
  label?: string;
  counter?: DayCounter;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2 sm:mb-3.5 sm:gap-2.5">
      {live ? (
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-w3-live-border bg-w3-live-soft px-2 py-0.5 text-[11px] font-bold tracking-wide text-w3-live sm:px-2.5 sm:py-1 sm:text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-w3-live opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-w3-live" />
          </span>
          EN VIVO AHORA
        </span>
      ) : (
        <span className="shrink-0 text-[10px] font-bold tracking-wide text-w3-primary sm:text-[13px]">
          {label}
        </span>
      )}
      <div className="h-px min-w-4 flex-1 bg-w3-border" />
      {counter && <DayCounterChip counter={counter} />}
    </div>
  );
}

function DayCounterChip({ counter }: { counter: DayCounter }) {
  const cls =
    counter.tone === 'warn'
      ? 'border-w3-warn/25 bg-w3-warn-soft text-w3-warn'
      : 'border-w3-primary-border bg-w3-primary-soft text-w3-primary';
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold sm:text-xs ${cls}`}
    >
      {counter.tone === 'warn' ? (
        <PencilLine className="h-3 w-3" />
      ) : (
        <Check className="h-3 w-3" />
      )}
      {counter.text}
    </span>
  );
}
