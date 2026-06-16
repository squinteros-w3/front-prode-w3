export type Role = 'USER' | 'ADMIN';
export type MatchStatus = 'SCHEDULED' | 'FINISHED';

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

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  createdAt: string;
}
