import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { LeaderboardEntry } from '../../lib/types';

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface Props {
  board: LeaderboardEntry[];
  meId: string | null;
}

export default function LeaderboardView({ board, meId }: Props) {
  const [query, setQuery] = useState('');

  const me = useMemo(
    () => board.find((e) => e.user.id === meId) ?? null,
    [board, meId],
  );
  const leader = board[0] ?? null;
  const gapToLeader = me && leader ? leader.points - me.points : 0;
  const podium = board.slice(0, 3);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return board;
    return board.filter((e) => e.user.name.toLowerCase().includes(q));
  }, [board, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-[34px]">
          Tabla de posiciones
        </h1>
        <p className="mt-1.5 text-sm text-w3-text-secondary sm:text-[15px]">
          Ordenada por puntos · desempate por resultados exactos
        </p>
      </div>

      {me && (
        <YourPosition
          entry={me}
          total={board.length}
          gapToLeader={gapToLeader}
        />
      )}

      {podium.length >= 3 && <Podium podium={podium} />}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-lg font-bold">Clasificación general</h2>
        <div className="flex items-center gap-2 rounded-w3-sm border border-w3-border bg-w3-surface px-3.5 py-2 sm:w-[280px]">
          <Search className="h-4 w-4 shrink-0 text-w3-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar jugador…"
            className="w-full min-w-0 bg-transparent text-sm text-w3-white outline-none placeholder:text-w3-text-muted"
            aria-label="Buscar jugador"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-w3-card border border-w3-border bg-w3-surface">
        <div className="hidden items-center gap-3 border-b border-w3-border bg-w3-surface-muted px-5 py-3 text-xs font-semibold uppercase tracking-wide text-w3-text-muted sm:flex">
          <span className="w-12">#</span>
          <span className="min-w-0 flex-1">Jugador</span>
          <span className="w-20 text-right">Exactos</span>
          <span className="w-20 text-right">Aciertos</span>
          <span className="w-16 text-right">Puntos</span>
        </div>

        <div className="divide-y divide-w3-border">
          {filtered.map((e) => (
            <Row key={e.user.id} entry={e} isMe={e.user.id === meId} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-w3-text-muted">
            {board.length === 0
              ? 'Todavía no hay puntajes.'
              : 'Ningún jugador coincide con la búsqueda.'}
          </p>
        )}
      </div>
    </div>
  );
}

function YourPosition({
  entry,
  total,
  gapToLeader,
}: {
  entry: LeaderboardEntry;
  total: number;
  gapToLeader: number;
}) {
  const sub =
    gapToLeader > 0
      ? `Vas ${entry.rank}° de ${total} · a ${gapToLeader} pts del líder`
      : `¡Vas 1° de ${total}! Liderás la tabla`;

  return (
    <div className="rounded-w3-card border border-w3-primary-border bg-w3-primary-soft p-4 sm:px-5 sm:py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Avatar
            name={entry.user.name}
            avatarUrl={entry.user.avatarUrl}
            className="h-12 w-12 ring-2 ring-w3-primary/50"
            textClass="text-base"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-display text-base font-bold sm:text-[17px]">
                {entry.user.name}
              </span>
              <span className="shrink-0 rounded-md bg-w3-primary px-2 py-0.5 text-[11px] font-bold text-w3-black">
                VOS
              </span>
            </div>
            <p className="mt-0.5 text-[13px] font-medium text-w3-text-secondary">
              {sub}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 sm:justify-end sm:gap-8">
          <Stat label="Puesto" value={`${entry.rank}°`} />
          <Stat label="Puntos" value={entry.points} accent />
          <Stat label="Exactos" value={entry.exacts} />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span
        className={`font-display text-xl font-bold tabular-nums sm:text-[22px] ${
          accent ? 'text-w3-primary' : 'text-w3-white'
        }`}
      >
        {value}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wide text-w3-text-muted">
        {label}
      </span>
    </div>
  );
}

const PODIUM_SLOTS = [
  {
    pick: 1,
    rank: 2,
    ring: 'ring-w3-silver',
    medal: 'bg-w3-silver',
    pedestal: 'h-24 border-w3-silver bg-w3-surface-muted sm:h-28',
    avatar: 'h-14 w-14',
    green: false,
  },
  {
    pick: 0,
    rank: 1,
    ring: 'ring-w3-gold',
    medal: 'bg-w3-gold',
    pedestal: 'h-32 border-transparent bg-w3-primary sm:h-40',
    avatar: 'h-16 w-16 sm:h-[68px] sm:w-[68px]',
    green: true,
  },
  {
    pick: 2,
    rank: 3,
    ring: 'ring-w3-bronze',
    medal: 'bg-w3-bronze',
    pedestal: 'h-20 border-w3-bronze bg-w3-surface-muted sm:h-24',
    avatar: 'h-14 w-14',
    green: false,
  },
];

function Podium({ podium }: { podium: LeaderboardEntry[] }) {
  return (
    <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
      {PODIUM_SLOTS.map((s) => {
        const entry = podium[s.pick];
        if (!entry) return <div key={s.rank} />;
        return (
          <div key={s.rank} className="flex flex-col items-center gap-2.5">
            <span
              className={`grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold text-w3-black ${s.medal}`}
            >
              {s.rank}
            </span>
            <Avatar
              name={entry.user.name}
              avatarUrl={entry.user.avatarUrl}
              className={`${s.avatar} ring-2 ${s.ring}`}
              textClass="text-sm"
            />
            <div className="flex max-w-full flex-col items-center">
              <span className="max-w-full truncate text-center text-[13px] font-bold sm:text-sm">
                {entry.user.name}
              </span>
              <span className="text-[11px] font-medium text-w3-text-muted">
                {entry.exacts} exactos
              </span>
            </div>
            <div
              className={`flex w-full flex-col items-center justify-center rounded-t-2xl border-x border-t ${s.pedestal}`}
            >
              <span
                className={`font-display text-xl font-extrabold tabular-nums sm:text-2xl ${
                  s.green ? 'text-w3-black' : 'text-w3-primary'
                }`}
              >
                {entry.points}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide ${
                  s.green ? 'text-w3-black/70' : 'text-w3-text-muted'
                }`}
              >
                pts
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Row({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 sm:px-5 ${
        isMe ? 'bg-w3-primary-soft' : 'transition-colors hover:bg-w3-surface-muted'
      }`}
    >
      <div className="w-9 shrink-0 sm:w-12">
        <RankBadge rank={entry.rank} />
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <Avatar
          name={entry.user.name}
          avatarUrl={entry.user.avatarUrl}
          className="h-8 w-8"
          textClass="text-[11px]"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">
              {entry.user.name}
            </span>
            {isMe && (
              <span className="shrink-0 rounded bg-w3-primary px-1.5 py-0.5 text-[10px] font-bold text-w3-black">
                VOS
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-w3-text-muted sm:hidden">
            {entry.exacts} exactos · {entry.hits} aciertos
          </p>
        </div>
      </div>

      <span className="hidden w-20 text-right text-sm font-semibold text-w3-text-secondary sm:block">
        {entry.exacts}
      </span>
      <span className="hidden w-20 text-right text-sm font-semibold text-w3-text-secondary sm:block">
        {entry.hits}
      </span>
      <span className="w-12 shrink-0 text-right font-display text-base font-extrabold tabular-nums text-w3-primary sm:w-16">
        {entry.points}
      </span>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const medal =
    rank === 1
      ? 'bg-w3-gold'
      : rank === 2
        ? 'bg-w3-silver'
        : rank === 3
          ? 'bg-w3-bronze'
          : null;

  if (medal) {
    return (
      <span
        className={`grid h-6 w-6 place-items-center rounded-full text-xs font-extrabold text-w3-black ${medal}`}
      >
        {rank}
      </span>
    );
  }
  return (
    <span className="grid h-6 w-6 place-items-center text-sm font-bold text-w3-text-muted">
      {rank}
    </span>
  );
}

function Avatar({
  name,
  avatarUrl,
  className,
  textClass = 'text-xs',
}: {
  name: string;
  avatarUrl: string | null;
  className: string;
  textClass?: string;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border border-w3-primary-border bg-w3-primary-soft font-bold text-w3-primary ${textClass} ${className}`}
    >
      {initials(name)}
    </span>
  );
}
