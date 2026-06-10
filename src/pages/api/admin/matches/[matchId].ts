import type { APIRoute } from 'astro';
import { apiFetch } from '../../../../lib/api';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const token = cookies.get('session')?.value ?? null;
  if (!token) {
    return new Response(JSON.stringify({ message: 'No autenticado' }), {
      status: 401,
    });
  }
  const body = await request.json();
  const res = await apiFetch(`/admin/matches/${params.matchId}/result`, {
    token,
    method: 'PATCH',
    body,
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
