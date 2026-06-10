const AR_TZ = 'America/Argentina/Buenos_Aires';

const dateTimeFmt = new Intl.DateTimeFormat('es-AR', {
  timeZone: AR_TZ,
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const timeFmt = new Intl.DateTimeFormat('es-AR', {
  timeZone: AR_TZ,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const dayFmt = new Intl.DateTimeFormat('es-AR', {
  timeZone: AR_TZ,
  weekday: 'long',
  day: '2-digit',
  month: 'long',
});

/** "mié 11 jun, 16:00" (horario argentino) */
export function formatKickoff(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

/** Clave/etiqueta de día en horario argentino, para agrupar partidos. */
export function formatDay(iso: string): string {
  return dayFmt.format(new Date(iso));
}

export function dayKey(iso: string): string {
  // YYYY-MM-DD en horario argentino
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: AR_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
  return parts;
}
