const RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(value: string): boolean {
  return typeof value === 'string' && value.length <= 254 && RE.test(value);
}
