import { test, expect } from 'bun:test';
import { validateNewsletter } from '../src/lib/validation/newsletter';

const base = { email: 'a@b.de', firstName: '', privacyConsent: true, honeypot: '' };

test('valid passes', () => {
  expect(validateNewsletter(base).ok).toBe(true);
});
test('honeypot fails', () => {
  expect(validateNewsletter({ ...base, honeypot: 'x' }).ok).toBe(false);
});
test('invalid email fails', () => {
  expect(validateNewsletter({ ...base, email: 'no' }).ok).toBe(false);
});
test('missing consent fails', () => {
  const r = validateNewsletter({ ...base, privacyConsent: false });
  expect(r.ok).toBe(false);
  expect(r.errors).toHaveProperty('privacyConsent');
});
