import type { LiveState, MatchView } from './types';

export type MatchPhase = 'open' | 'upcoming' | 'live' | 'finished';

export type StatusFilter = 'all' | MatchPhase;

export interface PhaseInfo {
  key: MatchPhase;
  label: string;
  hint: string;
  badgeFill: string;
  badgeText: string;
  dotColor: string;
  pulse: boolean;
}

/** Etiqueta corta del período/minuto de elnine para el badge y el chip. */
export function periodLabel(period: string, minute: number | null): string {
  if (period === 'HT') return 'Entretiempo';
  if (period === 'FT') return 'Final';
  if (minute != null) return `${minute}'`;
  if (period === '1T') return '1er tiempo';
  if (period === '2T') return '2do tiempo';
  return 'En juego';
}

/**
 * Deriva el estado "real" del partido. Si hay overlay de vivo (elnine) tiene
 * prioridad sobre la inferencia por lock/kickoff. El status FINISHED del backend
 * (worldcup26) siempre manda: es la fuente de verdad del resultado.
 */
export function getPhase(
  match: MatchView,
  now: number,
  live: LiveState | null = null,
): PhaseInfo {
  if (match.status === 'FINISHED') {
    return {
      key: 'finished',
      label: 'Finalizado',
      hint: 'El partido terminó',
      badgeFill: 'bg-w3-score-box',
      badgeText: 'text-w3-text-secondary',
      dotColor: 'bg-w3-text-muted',
      pulse: false,
    };
  }

  if (live?.status === 'live') {
    return {
      key: 'live',
      label: periodLabel(live.period, live.minute),
      hint: 'Jugándose ahora',
      badgeFill: 'bg-w3-live-soft',
      badgeText: 'text-w3-live',
      dotColor: 'bg-w3-live',
      pulse: true,
    };
  }

  if (live?.status === 'finished') {
    // elnine marca Final pero worldcup26 todavía no oficializó: lo dejamos en la
    // sección de vivo hasta que el sync lo pase a FINISHED.
    return {
      key: 'live',
      label: 'Final',
      hint: 'Resultado final (oficializando…)',
      badgeFill: 'bg-w3-live-soft',
      badgeText: 'text-w3-live',
      dotColor: 'bg-w3-live',
      pulse: false,
    };
  }

  const kickoff = new Date(match.kickoffAt).getTime();
  if (match.locked && now >= kickoff) {
    return {
      key: 'live',
      label: 'EN VIVO',
      hint: 'Jugándose ahora',
      badgeFill: 'bg-w3-live-soft',
      badgeText: 'text-w3-live',
      dotColor: 'bg-w3-live',
      pulse: true,
    };
  }

  if (match.locked) {
    return {
      key: 'upcoming',
      label: 'Por comenzar',
      hint: 'Predicciones cerradas · el partido está por empezar',
      badgeFill: 'bg-w3-warn-soft',
      badgeText: 'text-w3-warn',
      dotColor: 'bg-w3-warn',
      pulse: false,
    };
  }

  return {
    key: 'open',
    label: 'Abierto',
    hint: 'Podés cargar o editar tu predicción',
    badgeFill: 'bg-w3-primary-soft',
    badgeText: 'text-w3-primary',
    dotColor: 'bg-w3-primary',
    pulse: false,
  };
}

const STAGE_LABELS: Record<string, string> = {
  r32: '32avos',
  r16: 'Octavos',
  qf: 'Cuartos',
  sf: 'Semifinal',
  third: '3er puesto',
  final: 'Final',
};

export function stageLabel(match: { group: string | null; stage: string }): string {
  if (match.group) return `Grupo ${match.group}`;
  return STAGE_LABELS[match.stage] ?? match.stage;
}
