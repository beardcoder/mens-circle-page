import { test, expect } from 'bun:test';
import { isValidEmail } from '../src/lib/validation/email';

test('accepts valid email', () => {
  expect(isValidEmail('a@b.de')).toBe(true);
});
test('rejects missing @', () => {
  expect(isValidEmail('abc')).toBe(false);
});
test('rejects empty', () => {
  expect(isValidEmail('')).toBe(false);
});
test('rejects spaces', () => {
  expect(isValidEmail('a b@c.de')).toBe(false);
});
