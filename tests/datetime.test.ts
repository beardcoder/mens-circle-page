import { test, expect } from 'bun:test';
import { isPast, formatDateDe } from '../src/lib/datetime';

test('isPast true for past date', () => {
  expect(isPast(new Date('2000-01-01'), new Date('2026-01-01'))).toBe(true);
});
test('isPast false for future date', () => {
  expect(isPast(new Date('2030-01-01'), new Date('2026-01-01'))).toBe(false);
});
test('formatDateDe formats german', () => {
  const s = formatDateDe(new Date('2026-09-19T19:30:00+02:00'));
  expect(s).toContain('2026');
});
