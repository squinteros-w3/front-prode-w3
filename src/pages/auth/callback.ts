import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ url, cookies, redirect }) => {
  const token = url.searchParams.get('token');
  if (!token) {
    return redirect('/?error=auth');
  }
  cookies.set('session', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
  return redirect('/partidos');
};
