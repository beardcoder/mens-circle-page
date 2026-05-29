import { test, expect } from 'bun:test';
import { validateEventRegistration } from '../src/lib/validation/event-registration';

const base = {
  firstName: 'Max', lastName: 'Muster', email: 'max@muster.de',
  phone: '', message: '', privacyConsent: true, therapyConsent: true, honeypot: '',
};
const ctx = {
  now: new Date('2026-09-10T12:00:00+02:00'),
  event: { status: 'open' as const, date: new Date('2026-09-19T19:30:00+02:00'),
           registrationDeadline: new Date('2026-09-17T20:00:00+02:00'), capacity: 8 },
  currentCount: 3,
};

test('valid registration passes', () => {
  expect(validateEventRegistration(base, ctx).ok).toBe(true);
});
test('honeypot filled fails', () => {
  expect(validateEventRegistration({ ...base, honeypot: 'x' }, ctx).ok).toBe(false);
});
test('missing privacy consent fails', () => {
  const r = validateEventRegistration({ ...base, privacyConsent: false }, ctx);
  expect(r.ok).toBe(false);
  expect(r.errors).toHaveProperty('privacyConsent');
});
test('missing therapy consent fails', () => {
  expect(validateEventRegistration({ ...base, therapyConsent: false }, ctx).ok).toBe(false);
});
test('invalid email fails', () => {
  expect(validateEventRegistration({ ...base, email: 'nope' }, ctx).ok).toBe(false);
});
test('closed event fails', () => {
  const r = validateEventRegistration(base, { ...ctx, event: { ...ctx.event, status: 'closed' } });
  expect(r.ok).toBe(false);
  expect(r.errors).toHaveProperty('event');
});
test('past deadline fails', () => {
  const r = validateEventRegistration(base, { ...ctx, now: new Date('2026-09-18T00:00:00+02:00') });
  expect(r.ok).toBe(false);
});
test('full capacity fails', () => {
  const r = validateEventRegistration(base, { ...ctx, currentCount: 8 });
  expect(r.ok).toBe(false);
  expect(r.errors).toHaveProperty('capacity');
});
test('missing first name fails', () => {
  expect(validateEventRegistration({ ...base, firstName: '' }, ctx).ok).toBe(false);
});
