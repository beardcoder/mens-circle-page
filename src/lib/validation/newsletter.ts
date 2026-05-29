import { isValidEmail } from './email';

export interface NewsletterInput {
  email: string; firstName?: string; privacyConsent: boolean; honeypot?: string;
}
export interface ValidationResult { ok: boolean; errors: Record<string, string>; }

export function validateNewsletter(input: NewsletterInput): ValidationResult {
  const errors: Record<string, string> = {};
  if (input.honeypot && input.honeypot.trim() !== '') {
    return { ok: false, errors: { honeypot: 'Spam erkannt.' } };
  }
  if (!isValidEmail(input.email)) errors.email = 'Bitte gib eine gültige E-Mail-Adresse an.';
  if (!input.privacyConsent) errors.privacyConsent = 'Bitte stimme der Datenschutzerklärung zu.';
  return { ok: Object.keys(errors).length === 0, errors };
}
