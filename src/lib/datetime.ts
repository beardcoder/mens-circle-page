export function isPast(date: Date, now: Date = new Date()): boolean {
  return date.getTime() < now.getTime();
}

export function formatDateDe(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    timeZone: 'Europe/Berlin',
  }).format(date);
}

export function formatTimeDe(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin',
  }).format(date);
}
