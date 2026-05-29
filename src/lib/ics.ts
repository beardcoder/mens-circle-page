interface IcsEvent {
  uid: string; title: string; description: string; location: string;
  start: Date; end: Date;
}
function fmt(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
export function buildIcs(e: IcsEvent): string {
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Maennerkreis//DE',
    'BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${fmt(e.start)}`,
    `DTSTART:${fmt(e.start)}`, `DTEND:${fmt(e.end)}`,
    `SUMMARY:${esc(e.title)}`, `DESCRIPTION:${esc(e.description)}`,
    `LOCATION:${esc(e.location)}`, 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}
