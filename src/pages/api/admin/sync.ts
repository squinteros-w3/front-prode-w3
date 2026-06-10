import type { APIRoute } from 'astro';
import { apiFetch } from '../../../lib/api';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  const token = cookies.get('session')?.value ?? null;
  if (!token) {
    return new Response(JSON.stringify({ message: 'No autenticado' }), {
      status: 401,
    });
  }
  const res = await apiFetch('/admin/sync', { token, method: 'POST' });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
