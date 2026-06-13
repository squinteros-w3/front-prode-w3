import type { APIRoute } from 'astro';
import { apiFetch } from '../../lib/api';

export const prerender = false;

// Proxy del overlay de vivo. Best-effort: ante falta de sesión o error del
// backend devolvemos {} para que el cliente caiga al modo honesto sin romperse.
export const GET: APIRoute = async ({ cookies }) => {
  const empty = new Response('{}', {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  const token = cookies.get('session')?.value ?? null;
  if (!token) return empty;

  try {
    const res = await apiFetch('/live', { token });
    if (!res.ok) return empty;
    const text = await res.text();
    return new Response(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return empty;
  }
};
