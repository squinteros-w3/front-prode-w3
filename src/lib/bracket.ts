import type { BracketMatch, BracketSlot } from './types';

export const STAGE_ORDER = ['r32', 'r16', 'qf', 'sf', 'third', 'final'] as const;
export type Stage = (typeof STAGE_ORDER)[number];

/** Nombre largo de la fase (cabeceras, títulos). */
export const STAGE_LABELS: Record<string, string> = {
  r32: '16avos de final',
  r16: 'Octavos de final',
  qf: 'Cuartos de final',
  sf: 'Semifinales',
  third: 'Tercer puesto',
  final: 'Final',
};

/** Nombre corto (labels del cuadro / pasos del stepper). */
export const STAGE_SHORT: Record<string, string> = {
  r32: '16avos',
  r16: '8vos',
  qf: '4tos',
  sf: 'Semis',
  third: '3er puesto',
  final: 'Final',
};

/** Las rondas que arman las columnas del cuadro / pasos del stepper.
 * `third` no es un paso propio: se muestra junto a la Final. */
export const ROUND_STAGES = ['r32', 'r16', 'qf', 'sf', 'final'] as const;

export interface StageGroup {
  stage: string;
  label: string;
  short: string;
  matches: BracketMatch[];
}

/** Ganador del cruce, o null si todavía no está definido. */
export function winner(m: BracketMatch): 'home' | 'away' | null {
  if (m.status !== 'FINISHED' || m.home.score === null || m.away.score === null)
    return null;
  if (m.home.score > m.away.score) return 'home';
  if (m.away.score > m.home.score) return 'away';
  // Empate en los 90'/prórroga: se define por penales (los carga el admin).
  if (m.home.penalties !== null && m.away.penalties !== null) {
    if (m.home.penalties > m.away.penalties) return 'home';
    if (m.away.penalties > m.home.penalties) return 'away';
  }
  return null;
}

export function wentToPens(m: BracketMatch): boolean {
  return m.home.penalties !== null && m.away.penalties !== null;
}

/** Nombre a mostrar: el equipo si ya está definido, si no la etiqueta del cruce. */
export function slotName(slot: BracketSlot): string {
  return slot.team?.name ?? slot.label ?? 'A definir';
}

/** ¿El cruce ya tiene ambos equipos definidos? */
export function isDefined(m: BracketMatch): boolean {
  return m.home.team !== null && m.away.team !== null;
}

/** Ordena los cruces de una fase: por fecha si están programados, si no por el
 * orden del cuadro (externalId). */
function sortMatches(a: BracketMatch, b: BracketMatch): number {
  if (!a.kickoffAt || !b.kickoffAt) {
    return Number(a.externalId) - Number(b.externalId);
  }
  return new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime();
}

/** Agrupa el bracket por fase, en orden, descartando fases vacías. */
export function groupByStage(bracket: BracketMatch[]): StageGroup[] {
  return STAGE_ORDER.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage] ?? stage,
    short: STAGE_SHORT[stage] ?? stage,
    matches: bracket.filter((m) => m.stage === stage).sort(sortMatches),
  })).filter((s) => s.matches.length > 0);
}

/** Progreso de una ronda: cuántos cruces ya se jugaron sobre el total. */
export function roundProgress(matches: BracketMatch[]): {
  played: number;
  total: number;
} {
  return {
    played: matches.filter((m) => m.status === 'FINISHED').length,
    total: matches.length,
  };
}
