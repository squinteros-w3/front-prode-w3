import { CheckCircle2, Lock, PencilLine, Trophy } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { groupByStage, slotName } from '../../lib/bracket';
import { dayKey, formatKickoff, formatKickoffCompact } from '../../lib/format';
import type { BracketMatch, BracketSlot, MatchPrediction, MatchView } from '../../lib/types';
import MatchCard from './MatchCard';
import type { DayTab } from './MatchesToolbar';

/** Etiqueta corta para el badge de cada tarjeta. */
const STAGE_BADGE: Record<string, string> = {
  r32: '16avos',
  r16: 'Octavos',
  qf: 'Cuartos',
  sf: 'Semifinal',
  third: '3er puesto',
  final: 'Final',
};

interface Props {
  bracket: BracketMatch[];
  matches: MatchView[];
  now: number;
  today: string;
  dayTab: DayTab;
  highlightId: string | null;
  onPredictionSaved: (matchId: string, prediction: MatchPrediction) => void;
}

export default function KnockoutView({
  bracket,
  matches,
  now,
  today,
  dayTab,
  highlightId,
  onPredictionSaved,
}: Props) {
  const matchByExternal = useMemo(() => {
    const map = new Map<string, MatchView>();
    for (const m of matches) map.set(m.externalId, m);
    return map;
  }, [matches]);

  const rounds = useMemo(() => groupByStage(bracket), [bracket]);

  // Con "Hoy" sólo se muestran los cruces ya definidos de la fecha; los
  // placeholders ("a definir") quedan ocultos. Sin filtro se ve el cuadro
  // completo, igual que el diseño.
  const entryVisible = (mv: MatchView | undefined): boolean => {
    if (dayTab === 'all') return true;
    if (!mv) return false;
    if (dayTab === 'today' && dayKey(mv.kickoffAt) !== today) return false;
    return true;
  };

  if (rounds.length === 0) {
    return (
      <div className="rounded-w3-card border border-w3-border bg-w3-surface p-8 text-center">
        <p className="text-4xl">🏆</p>
        <p className="mt-3 font-semibold">El cuadro todavía no está disponible</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-w3-text-secondary">
          En cuanto se publique el fixture de la eliminatoria vas a ver acá todos
          los cruces para cargar tus pronósticos.
        </p>
      </div>
    );
  }

  const visibleRounds = rounds
    .map((round) => ({
      round,
      matches: round.matches.filter((bm) =>
        entryVisible(matchByExternal.get(bm.externalId)),
      ),
    }))
    .filter((r) => r.matches.length > 0);

  if (visibleRounds.length === 0) {
    return (
      <p className="rounded-w3-card border border-w3-border bg-w3-surface p-6 text-center text-w3-text-secondary">
        No hay partidos con estos filtros.
      </p>
    );
  }

  return (
    <div className="space-y-7 sm:space-y-9">
      {visibleRounds.map(({ round, matches: roundMatches }) => {
        const isFinal = round.stage === 'final';
        const counter = roundCounter(round.matches, matchByExternal, now);
        return (
          <section key={round.stage}>
            <RoundHeader
              label={round.label.toUpperCase()}
              counter={counter}
            />
            <div className="space-y-2.5 sm:space-y-3.5">
              {roundMatches.map((bm) => {
                const mv = matchByExternal.get(bm.externalId);
                if (mv) {
                  return (
                    <div
                      key={bm.externalId}
                      id={`match-${mv.id}`}
                      className={`scroll-mt-24 rounded-2xl transition-shadow duration-500 sm:scroll-mt-28 sm:rounded-w3-card ${
                        highlightId === mv.id
                          ? 'ring-2 ring-w3-primary ring-offset-2 ring-offset-w3-black'
                          : ''
                      }`}
                    >
                      <MatchCard
                        match={mv}
                        now={now}
                        onPredictionSaved={onPredictionSaved}
                      />
                    </div>
                  );
                }
                return (
                  <PlaceholderCard
                    key={bm.externalId}
                    match={bm}
                    badge={STAGE_BADGE[round.stage] ?? round.short}
                    isFinal={isFinal}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

    </div>
  );
}

type CounterTone = 'gold' | 'muted' | 'primary';

interface Counter {
  icon: ReactNode;
  text: string;
  tone: CounterTone;
}

function roundCounter(
  matchesInRound: BracketMatch[],
  matchByExternal: Map<string, MatchView>,
  now: number,
): Counter {
  let hasDefined = false;
  let toLoad = 0;
  for (const bm of matchesInRound) {
    if (bm.home.team && bm.away.team) hasDefined = true;
    const mv = matchByExternal.get(bm.externalId);
    if (mv && !mv.locked && mv.status === 'SCHEDULED' && mv.prediction == null) {
      toLoad += 1;
    }
  }
  void now;

  if (!hasDefined) {
    return { icon: <Lock className="h-3 w-3" />, text: 'A definir', tone: 'muted' };
  }
  if (toLoad > 0) {
    return {
      icon: <PencilLine className="h-3 w-3" />,
      text: `${toLoad} por cargar`,
      tone: 'gold',
    };
  }
  return {
    icon: <CheckCircle2 className="h-3 w-3" />,
    text: 'Al día',
    tone: 'primary',
  };
}

function RoundHeader({ label, counter }: { label: string; counter: Counter }) {
  const counterClass =
    counter.tone === 'gold'
      ? 'border-w3-gold/25 bg-w3-gold-soft text-w3-warn'
      : counter.tone === 'primary'
        ? 'border-w3-primary-border bg-w3-primary-soft text-w3-primary'
        : 'border-w3-border bg-w3-surface-muted text-w3-text-muted';

  return (
    <div className="mb-3 flex items-center gap-2.5 sm:mb-4">
      <Trophy className="h-3.5 w-3.5 shrink-0 text-w3-gold" />
      <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-w3-gold sm:text-[13px]">
        {label}
      </span>
      <div className="h-px min-w-3 flex-1 bg-w3-border" />
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold sm:text-xs ${counterClass}`}
      >
        {counter.icon}
        {counter.text}
      </span>
    </div>
  );
}

function SlotFlag({ slot }: { slot: BracketSlot }) {
  if (slot.team?.flagUrl) {
    return (
      <img
        src={slot.team.flagUrl}
        alt=""
        className="h-5 w-7 shrink-0 rounded-[4px] object-cover ring-1 ring-w3-border sm:h-[23px] sm:w-8 sm:rounded-[5px]"
      />
    );
  }
  return (
    <span className="grid h-5 w-7 shrink-0 place-items-center rounded-[4px] bg-w3-score-box text-xs font-bold text-w3-text-muted sm:h-[23px] sm:w-8 sm:rounded-[5px]">
      ?
    </span>
  );
}

function PlaceholderCard({
  match,
  badge,
  isFinal,
}: {
  match: BracketMatch;
  badge: string;
  isFinal: boolean;
}) {
  const cardClass = isFinal
    ? 'border-w3-gold/50 bg-w3-surface'
    : 'border-w3-border bg-w3-surface-muted opacity-90';

  const statusClass = isFinal
    ? 'bg-w3-gold-soft text-w3-gold'
    : 'bg-w3-surface text-w3-text-muted';
  const statusText = isFinal ? 'Gran final' : 'Se define luego';

  const footerIcon = isFinal ? (
    <Trophy className="h-3.5 w-3.5 text-w3-gold" />
  ) : (
    <Lock className="h-3.5 w-3.5 text-w3-text-muted" />
  );
  const footerText = isFinal
    ? 'El campeón se define acá'
    : 'Se habilita al definirse los clasificados';
  const footerClass = isFinal ? 'text-w3-gold' : 'text-w3-text-muted';

  return (
    <div
      className={`rounded-2xl border px-3.5 py-3 sm:rounded-w3-card sm:px-[22px] sm:py-[18px] ${cardClass}`}
    >
      {/* Meta */}
      <div className="mb-2.5 flex items-center justify-between gap-2 sm:mb-4">
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden sm:gap-2.5">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-w3-border bg-w3-surface-muted px-1.5 py-0.5 text-[11px] font-semibold text-w3-gold sm:rounded-lg sm:px-2 sm:text-xs">
            <Trophy className="h-3 w-3" />
            {badge}
          </span>
          {match.kickoffAt && (
            <>
              <span className="truncate text-[11px] font-medium text-w3-text-muted sm:hidden">
                {formatKickoffCompact(match.kickoffAt)}
              </span>
              <span className="hidden truncate text-[13px] font-medium text-w3-text-muted sm:inline">
                {formatKickoff(match.kickoffAt)}
              </span>
            </>
          )}
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold sm:px-2.5 sm:py-1 sm:text-xs ${statusClass}`}
        >
          {statusText}
        </span>
      </div>

      {/* Cruce */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 sm:gap-4">
        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-3">
          <span className="truncate text-right text-sm font-medium text-w3-text-secondary sm:text-[15px]">
            {slotName(match.home)}
          </span>
          <SlotFlag slot={match.home} />
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2.5">
          <ScoreBoxEmpty />
          <span className="font-display text-base font-bold text-w3-text-muted sm:text-[22px]">
            :
          </span>
          <ScoreBoxEmpty />
        </div>

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          <SlotFlag slot={match.away} />
          <span className="truncate text-sm font-medium text-w3-text-secondary sm:text-[15px]">
            {slotName(match.away)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 flex min-h-0 items-center justify-center gap-2 pt-1.5 text-center sm:min-h-[34px] sm:pt-2">
        {footerIcon}
        <span className={`text-xs font-medium sm:text-[13px] ${footerClass}`}>
          {footerText}
        </span>
      </div>
    </div>
  );
}

function ScoreBoxEmpty() {
  return (
    <div className="flex w-14 flex-col items-center justify-center rounded-xl border border-w3-border bg-w3-surface-muted py-1.5 sm:w-[60px] sm:py-2">
      <span className="font-display text-xl font-bold tabular-nums text-w3-text-muted sm:text-[26px]">
        –
      </span>
    </div>
  );
}
