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
  third: '3er y 4to puesto',
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

/** Nombre corto del lado de un cruce (para el ganador por penales elegido). */
function sideShortName(m: BracketMatch, side: 'home' | 'away'): string {
  const slot = m[side];
  return (
    slot.team?.code ??
    slot.team?.name ??
    (side === 'home' ? 'Local' : 'Visitante')
  );
}

/** Resumen del pronóstico del usuario: "2–2 · pen ARG" o "2–1". null si no hay. */
export function predictionSummary(m: BracketMatch): string | null {
  const p = m.prediction;
  if (!p) return null;
  let s = `${p.homeScore}–${p.awayScore}`;
  if (p.penaltyWinner) {
    const side = p.penaltyWinner === 'HOME' ? 'home' : 'away';
    s += ` · pen ${sideShortName(m, side)}`;
  }
  return s;
}

/** Marcador pronosticado, sin penales: "2-0". null si no hay pronóstico. */
export function predictionScore(m: BracketMatch): string | null {
  const p = m.prediction;
  return p ? `${p.homeScore}-${p.awayScore}` : null;
}

/** Equipo que el usuario eligió como ganador por penales (empate pronosticado). */
export function predictedAdvancer(
  m: BracketMatch,
): { flagUrl: string | null; name: string } | null {
  const p = m.prediction;
  if (!p?.penaltyWinner) return null;
  const side = p.penaltyWinner === 'HOME' ? 'home' : 'away';
  return { flagUrl: m[side].team?.flagUrl ?? null, name: sideShortName(m, side) };
}

/** Línea del resultado real por penales: "Penales 4-2 · Avanza Brasil". */
export function penAdvanceLine(m: BracketMatch): string | null {
  if (!wentToPens(m)) return null;
  const w = winner(m);
  const name = w ? sideShortName(m, w) : '';
  return `Penales ${m.home.penalties}-${m.away.penalties}${name ? ` · Avanza ${name}` : ''}`;
}

export type PointsTone = 'primary' | 'gold' | 'muted';

/** Badge de puntos del pronóstico (solo en partidos finalizados con pronóstico). */
export function pointsBadge(
  m: BracketMatch,
): { text: string; short: string; tone: PointsTone } | null {
  if (m.status !== 'FINISHED' || !m.prediction) return null;
  const pts = m.prediction.pointsAwarded;
  if (pts >= 5)
    return { text: 'Exacto + ganador · +5', short: '+5', tone: 'primary' };
  if (pts >= 3) return { text: 'Exacto · +3', short: '+3', tone: 'primary' };
  if (pts === 1) return { text: 'Resultado · +1', short: '+1', tone: 'gold' };
  return { text: 'Sin acierto · +0', short: '+0', tone: 'muted' };
}

/** Nombre a mostrar: el equipo si ya está definido, si no la etiqueta del cruce. */
export function slotName(slot: BracketSlot): string {
  return slot.team?.name ?? slot.label ?? 'A definir';
}

/** ¿El cruce ya tiene ambos equipos definidos? */
export function isDefined(m: BracketMatch): boolean {
  return m.home.team !== null && m.away.team !== null;
}

// Quién alimenta a cada cruce de 8vos en adelante (estructura FIJA FIFA 2026,
// el mismo cuadro que arma el backend). Cada partido se nutre de dos previos.
//   8vos:  89=G74/G77  90=G73/G75  91=G76/G78  92=G79/G80
//          93=G83/G84  94=G81/G82  95=G86/G88  96=G85/G87
// Si no aparece acá es una hoja (un 16avo, partidos 73–88).
const FEEDERS: Record<number, [number, number]> = {
  104: [101, 102],
  101: [97, 98],
  102: [99, 100],
  97: [89, 90],
  98: [93, 94],
  99: [91, 92],
  100: [95, 96],
  89: [74, 77],
  90: [73, 75],
  91: [76, 78],
  92: [79, 80],
  93: [83, 84],
  94: [81, 82],
  95: [86, 88],
  96: [85, 87],
};

// Posición vertical de cada partido dentro de su ronda = índice de su 16avo
// más a la izquierda en el recorrido del árbol (home antes que away). Ordenar
// cada ronda por este valor deja dos cajas adyacentes siempre alimentando el
// mismo cruce siguiente; ordenar por externalId u horario rompe los cruces.
const BRACKET_ORDER: Record<number, number> = (() => {
  const leaves: number[] = [];
  const collect = (n: number) => {
    const f = FEEDERS[n];
    if (!f) return void leaves.push(n);
    collect(f[0]);
    collect(f[1]);
  };
  collect(104);
  const leafIndex = new Map(leaves.map((n, i) => [n, i]));
  const leftmost = (n: number): number => {
    const f = FEEDERS[n];
    return f ? leftmost(f[0]) : (leafIndex.get(n) ?? 0);
  };
  const order: Record<number, number> = {};
  for (const n of [104, ...Object.keys(FEEDERS).map(Number), ...leaves]) {
    order[n] = leftmost(n);
  }
  return order;
})();

/** Ordena los cruces de una fase por su posición en el cuadro (orden de árbol),
 * no por número de partido ni horario, para que los cruces se dibujen bien. */
function sortMatches(a: BracketMatch, b: BracketMatch): number {
  const ea = Number(a.externalId);
  const eb = Number(b.externalId);
  return (BRACKET_ORDER[ea] ?? ea) - (BRACKET_ORDER[eb] ?? eb);
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
