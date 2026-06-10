import React, { useState } from 'react';
import { formatKickoff } from '../lib/format';
import type { AdminUser, MatchView } from '../lib/types';

type Tab = 'sync' | 'resultados' | 'usuarios';

export default function AdminPanel({
  matches,
  users,
}: {
  matches: MatchView[];
  users: AdminUser[];
}) {
  const [tab, setTab] = useState<Tab>('sync');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'sync', label: 'Sincronizar' },
    { key: 'resultados', label: 'Resultados' },
    { key: 'usuarios', label: 'Usuarios' },
  ];

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-w3-primary text-w3-black'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sync' && <SyncTab />}
      {tab === 'resultados' && <ResultsTab matches={matches} />}
      {tab === 'usuarios' && <UsersTab users={users} />}
    </div>
  );
}

function SyncTab() {
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'error'>(
    'idle',
  );
  const [summary, setSummary] = useState<string | null>(null);

  async function run() {
    setState('running');
    setSummary(null);
    try {
      const res = await fetch('/api/admin/sync', { method: 'POST' });
      if (!res.ok) throw new Error('Falló el sync');
      const data = await res.json();
      setSummary(
        `${data.teams} equipos · ${data.matches} partidos · ${data.scored} puntuados · ${data.skipped} omitidos`,
      );
      setState('done');
    } catch (e) {
      setSummary((e as Error).message);
      setState('error');
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="font-semibold">Sincronización manual</h3>
      <p className="mt-1 text-sm text-white/50">
        Trae fixture y resultados desde worldcup26.ir. El sistema también
        sincroniza automáticamente al mediodía y a la noche (horario argentino).
      </p>
      <button
        onClick={run}
        disabled={state === 'running'}
        className="mt-4 rounded-lg bg-w3-primary px-5 py-2.5 font-semibold text-w3-black disabled:opacity-50"
      >
        {state === 'running' ? 'Sincronizando…' : 'Sincronizar ahora'}
      </button>
      {summary && (
        <p
          className={`mt-3 text-sm ${
            state === 'error' ? 'text-red-400' : 'text-w3-primary'
          }`}
        >
          {summary}
        </p>
      )}
    </div>
  );
}

function ResultsTab({ matches }: { matches: MatchView[] }) {
  const [q, setQ] = useState('');
  const filtered = matches.filter((m) =>
    `${m.homeTeam.name} ${m.awayTeam.name}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar equipo…"
        className="mb-4 w-full rounded-lg border border-white/15 bg-w3-black px-3 py-2 text-sm outline-none focus:border-w3-primary"
      />
      <div className="space-y-2">
        {filtered.map((m) => (
          <ResultRow key={m.id} match={m} />
        ))}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-white/40">Sin partidos.</p>
        )}
      </div>
    </div>
  );
}

function ResultRow({ match }: { match: MatchView }) {
  const [home, setHome] = useState(
    match.homeScore !== null ? String(match.homeScore) : '',
  );
  const [away, setAway] = useState(
    match.awayScore !== null ? String(match.awayScore) : '',
  );
  const [penHome, setPenHome] = useState(
    match.homePenalties !== null ? String(match.homePenalties) : '',
  );
  const [penAway, setPenAway] = useState(
    match.awayPenalties !== null ? String(match.awayPenalties) : '',
  );
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );

  const isKnockout = match.stage !== 'group';
  // Mostrar penales solo en eliminación y cuando el resultado cargado es empate.
  const showPens = isKnockout && home !== '' && away !== '' && home === away;

  async function save() {
    const h = Number(home);
    const a = Number(away);
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) {
      setState('error');
      return;
    }
    const body: Record<string, number> = { homeScore: h, awayScore: a };
    if (showPens && penHome !== '' && penAway !== '') {
      body.homePenalties = Number(penHome);
      body.awayPenalties = Number(penAway);
    }
    setState('saving');
    try {
      const res = await fetch(`/api/admin/matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setState('saved');
      setTimeout(() => setState('idle'), 1500);
    } catch {
      setState('error');
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {match.homeTeam.name} vs {match.awayTeam.name}
          </p>
          <p className="text-xs text-white/40">
            {formatKickoff(match.kickoffAt)} ·{' '}
            {match.status === 'FINISHED' ? 'Finalizado' : 'Programado'}
            {isKnockout ? ' · Eliminación' : ''}
          </p>
        </div>
        <input
          type="number"
          min={0}
          value={home}
          onChange={(e) => setHome(e.target.value.slice(0, 2))}
          className="h-9 w-12 rounded-lg border border-white/15 bg-w3-black text-center font-bold outline-none focus:border-w3-primary"
        />
        <span className="text-white/30">:</span>
        <input
          type="number"
          min={0}
          value={away}
          onChange={(e) => setAway(e.target.value.slice(0, 2))}
          className="h-9 w-12 rounded-lg border border-white/15 bg-w3-black text-center font-bold outline-none focus:border-w3-primary"
        />
        <button
          onClick={save}
          disabled={state === 'saving'}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            state === 'saved'
              ? 'bg-w3-primary/20 text-w3-primary'
              : state === 'error'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-w3-primary text-w3-black'
          }`}
        >
          {state === 'saving'
            ? '…'
            : state === 'saved'
              ? '✓'
              : state === 'error'
                ? 'Error'
                : 'Guardar'}
        </button>
      </div>

      {showPens && (
        <div className="mt-2 flex items-center gap-2 border-t border-white/5 pt-2 text-xs text-white/50">
          <span className="flex-1">Empate → penales</span>
          <input
            type="number"
            min={0}
            value={penHome}
            onChange={(e) => setPenHome(e.target.value.slice(0, 2))}
            placeholder="0"
            className="h-8 w-11 rounded-lg border border-white/15 bg-w3-black text-center font-bold text-w3-white outline-none focus:border-w3-primary"
          />
          <span className="text-white/30">:</span>
          <input
            type="number"
            min={0}
            value={penAway}
            onChange={(e) => setPenAway(e.target.value.slice(0, 2))}
            placeholder="0"
            className="h-8 w-11 rounded-lg border border-white/15 bg-w3-black text-center font-bold text-w3-white outline-none focus:border-w3-primary"
          />
          <span className="w-[68px]" />
        </div>
      )}
    </div>
  );
}

function UsersTab({ users }: { users: AdminUser[] }) {
  const [list, setList] = useState(users);

  async function toggleRole(u: AdminUser) {
    const role = u.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setList((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, role } : x)),
      );
    }
  }

  return (
    <div className="space-y-2">
      {list.map((u) => (
        <div
          key={u.id}
          className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{u.name}</p>
            <p className="truncate text-xs text-white/40">{u.email}</p>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              u.role === 'ADMIN'
                ? 'bg-w3-primary/15 text-w3-primary'
                : 'bg-white/10 text-white/50'
            }`}
          >
            {u.role}
          </span>
          <button
            onClick={() => toggleRole(u)}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/5"
          >
            {u.role === 'ADMIN' ? 'Quitar admin' : 'Hacer admin'}
          </button>
        </div>
      ))}
      {list.length === 0 && (
        <p className="py-6 text-center text-sm text-white/40">Sin usuarios.</p>
      )}
    </div>
  );
}
