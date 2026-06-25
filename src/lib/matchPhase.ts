import type { MatchView } from './types';

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

/**
 * Deriva el estado "real" del partido combinando el status del backend
 * (SCHEDULED/FINISHED) con el lock de predicciones y el horario de kickoff.
 */
export function getPhase(match: MatchView, now: number): PhaseInfo {
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
  r32: '16avos',
  r16: 'Octavos',
  qf: 'Cuartos',
  sf: 'Semifinal',
  third: '3er puesto',
  final: 'Final',
};

export function stageLabel(match: { group: string | null; stage: string }): string {
  if (match.stage === 'group' && match.group) return `Grupo ${match.group}`;
  return STAGE_LABELS[match.stage] ?? match.stage;
}
