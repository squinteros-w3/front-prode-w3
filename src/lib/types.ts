export type Role = 'USER' | 'ADMIN';
export type MatchStatus = 'SCHEDULED' | 'FINISHED';
/** Lado ganador por penales (HOME = local, AWAY = visitante). */
export type PenaltyWinner = 'HOME' | 'AWAY';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: Role;
}

export interface TeamLite {
  id: string;
  name: string;
  code: string | null;
  group: string | null;
  flagUrl: string | null;
}

export interface MatchPrediction {
  homeScore: number;
  awayScore: number;
  /** Ganador por penales elegido en un empate de eliminación; null si no aplica. */
  penaltyWinner: PenaltyWinner | null;
  pointsAwarded: number;
  isExact: boolean;
}

export interface MatchView {
  id: string;
  externalId: string;
  stage: string;
  group: string | null;
  matchday: number | null;
  kickoffAt: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  locksAt: string;
  locked: boolean;
  homeTeam: TeamLite;
  awayTeam: TeamLite;
  prediction: MatchPrediction | null;
}

export interface MatchResultEntry {
  user: { id: string; name: string; avatarUrl: string | null };
  homeScore: number;
  awayScore: number;
  penaltyWinner: PenaltyWinner | null;
  points: number;
  isExact: boolean;
}

export interface MatchResults {
  available: boolean;
  homeScore?: number;
  awayScore?: number;
  predictions?: MatchResultEntry[];
}

export interface LivePredictionEntry {
  user: { id: string; name: string; avatarUrl: string | null };
  homeScore: number;
  awayScore: number;
  penaltyWinner: PenaltyWinner | null;
}

export interface LivePredictions {
  available: boolean;
  total?: number;
  predictions?: LivePredictionEntry[];
}

export interface LeaderboardEntry {
  rank: number;
  user: { id: string; name: string; avatarUrl: string | null };
  points: number;
  exacts: number;
  /** Solo ganador/empate acertado (+1). NO incluye los exactos. */
  outcomes: number;
  /** Partidos finalizados que no acertó (predijo mal o no predijo). */
  misses: number;
  predictions: number;
}

export interface Medal {
  id: string;
  label: string;
  description: string;
  earned: boolean;
}

export interface UserStats {
  totalPoints: number;
  exactCount: number;
  outcomeCount: number;
  scoredPredictions: number;
  totalPredictions: number;
  bestStreak: number;
  rank: number | null;
  totalPlayers: number;
  medals: Medal[];
}

export interface StandingRow {
  team: { id: string; name: string; code: string | null; flagUrl: string | null };
  mp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

export interface GroupStanding {
  group: string;
  standings: StandingRow[];
}

export interface ThirdPlaceRow extends StandingRow {
  group: string;
  /** Posición entre los 12 terceros (1 = mejor). */
  rank: number;
  /** Cae dentro de los 8 que clasifican (provisorio hasta cerrar la fase). */
  qualified: boolean;
}

export interface ThirdPlaceRanking {
  /** True cuando los 12 grupos terminaron de jugar (ranking definitivo). */
  complete: boolean;
  rows: ThirdPlaceRow[];
}

export interface BracketSlot {
  /** Equipo ya definido; null si el cruce todavía no tiene equipo. */
  team: { id: string; name: string; code: string | null; flagUrl: string | null } | null;
  /** Etiqueta del cruce ("Ganador Grupo A", "3º (...)", etc.) cuando no hay equipo. */
  label: string | null;
  score: number | null;
  penalties: number | null;
}

export interface BracketMatch {
  externalId: string;
  stage: string;
  /** ISO UTC; null mientras el partido no esté programado en la DB. */
  kickoffAt: string | null;
  /** Ciudad de la sede; null mientras el partido no esté cargado en la DB. */
  city: string | null;
  status: MatchStatus;
  home: BracketSlot;
  away: BracketSlot;
  /** Pronóstico del usuario para este cruce (mergeado desde /matches). */
  prediction?: MatchPrediction | null;
}

export interface AdminMatchView {
  id: string;
  externalId: string;
  stage: string;
  group: string | null;
  matchday: number | null;
  kickoffAt: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  /** Resultado cargado a mano por el admin (no lo pisa el sync). */
  manualResult: boolean;
  /** Último marcador finalizado que reportó la API (null si aún no lo da por terminado). */
  apiHomeScore: number | null;
  apiAwayScore: number | null;
  homeTeam: TeamLite;
  awayTeam: TeamLite;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  createdAt: string;
}
