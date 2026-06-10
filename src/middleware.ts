import { defineMiddleware } from 'astro:middleware';
import { getMe } from './lib/api';

const PROTECTED = ['/partidos', '/leaderboard', '/perfil', '/admin'];

export const onRequest = defineMiddleware(async (context, next) => {
  const token = context.cookies.get('session')?.value ?? null;
  context.locals.token = token;
  context.locals.user = null;

  if (token) {
    const user = await getMe(token);
    if (user) {
      context.locals.user = user;
    } else {
      context.cookies.delete('session', { path: '/' });
      context.locals.token = null;
    }
  }

  const path = context.url.pathname;
  const needsAuth = PROTECTED.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );

  if (needsAuth && !context.locals.user) {
    return context.redirect('/');
  }
  if (path.startsWith('/admin') && context.locals.user?.role !== 'ADMIN') {
    return context.redirect('/partidos');
  }

  return next();
});
