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
  locksAt: string;
  locked: boolean;
  homeTeam: TeamLite;
  awayTeam: TeamLite;
  prediction: MatchPrediction | null;
}

export interface LeaderboardEntry {
  rank: number;
  user: { id: string; name: string; avatarUrl: string | null };
  points: number;
  exacts: number;
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

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  createdAt: string;
}
