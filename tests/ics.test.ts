import { test, expect } from 'bun:test';
import { buildIcs } from '../src/lib/ics';

test('buildIcs contains VEVENT and title', () => {
  const ics = buildIcs({
    uid: 'evt-1@maennerkreis',
    title: 'Männerkreis-Abend',
    description: 'Test',
    location: 'Geiselhöring',
    start: new Date('2026-09-19T19:30:00+02:00'),
    end: new Date('2026-09-19T22:00:00+02:00'),
  });
  expect(ics).toContain('BEGIN:VEVENT');
  expect(ics).toContain('SUMMARY:Männerkreis-Abend');
  expect(ics).toContain('END:VCALENDAR');
});

test('buildIcs emits UTC instants with trailing Z', () => {
  const ics = buildIcs({
    uid: 'evt-2@maennerkreis',
    title: 'X', description: 'Y', location: 'Z',
    start: new Date('2026-09-19T19:30:00+02:00'), // 17:30 UTC
    end: new Date('2026-09-19T22:00:00+02:00'),   // 20:00 UTC
  });
  expect(ics).toContain('DTSTART:20260919T173000Z');
  expect(ics).toContain('DTEND:20260919T200000Z');
});
