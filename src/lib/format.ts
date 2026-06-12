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

function kickoffDateParts(iso: string) {
  const d = new Date(iso);
  const weekday = new Intl.DateTimeFormat('es-AR', {
    timeZone: AR_TZ,
    weekday: 'short',
  })
    .format(d)
    .replace(/[.,]/g, '')
    .trim();
  const dayMonth = new Intl.DateTimeFormat('es-AR', {
    timeZone: AR_TZ,
    day: 'numeric',
    month: 'short',
  }).format(d);
  const time = timeFmt.format(d);
  return { weekday, dayMonth, time };
}

/** "jue 11 jun · 16:00 hs" (horario argentino) */
export function formatKickoff(iso: string): string {
  const { weekday, dayMonth, time } = kickoffDateParts(iso);
  return `${weekday} ${dayMonth} · ${time} hs`;
}

/** "11 jun · 16:00" — compacto para mobile */
export function formatKickoffCompact(iso: string): string {
  const { dayMonth, time } = kickoffDateParts(iso);
  return `${dayMonth} · ${time}`;
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

/** Clave/etiqueta de día en horario argentino, para agrupar partidos. */
export function formatDay(iso: string): string {
  return dayFmt.format(new Date(iso));
}

/** "JUEVES, 11 DE JUNIO" (horario argentino) */
export function formatDayUpper(iso: string): string {
  return dayFmt.format(new Date(iso)).toUpperCase();
}

/** "11 jun" — fecha corta para listas compactas */
export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: AR_TZ,
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

export function todayKey(): string {
  return dayKey(new Date().toISOString());
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
