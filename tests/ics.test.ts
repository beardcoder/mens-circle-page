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
