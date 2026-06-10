import type {
  AdminUser,
  AppUser,
  LeaderboardEntry,
  MatchView,
  UserStats,
} from './types';

const API_URL =
  import.meta.env.BACKEND_API_URL ?? 'http://localhost:3000/api';

interface FetchOpts {
  token?: string | null;
  method?: string;
  body?: unknown;
}

/** Fetch contra el backend NestJS. Devuelve la Response cruda. */
export async function apiFetch(
  path: string,
  opts: FetchOpts = {},
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  return fetch(`${API_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

async function getJson<T>(path: string, token: string | null): Promise<T | null> {
  try {
    const res = await apiFetch(path, { token });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const getMe = (token: string | null) =>
  getJson<AppUser>('/auth/me', token);

export const getMatches = (token: string | null) =>
  getJson<MatchView[]>('/matches', token).then((r) => r ?? []);

export const getLeaderboard = (token: string | null) =>
  getJson<LeaderboardEntry[]>('/leaderboard', token).then((r) => r ?? []);

export const getStats = (token: string | null) =>
  getJson<UserStats>('/stats/me', token);

export const getAdminUsers = (token: string | null) =>
  getJson<AdminUser[]>('/admin/users', token).then((r) => r ?? []);
