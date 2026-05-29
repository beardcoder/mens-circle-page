import { isValidEmail } from './email';

export interface EventRegistrationInput {
  firstName: string; lastName: string; email: string;
  phone?: string; message?: string;
  privacyConsent: boolean; therapyConsent: boolean; honeypot?: string;
}
export interface EventContext {
  now: Date;
  event: { status: 'open' | 'closed' | 'cancelled'; date: Date; registrationDeadline: Date; capacity: number };
  currentCount: number;
}
export interface ValidationResult { ok: boolean; errors: Record<string, string>; }

export function validateEventRegistration(input: EventRegistrationInput, ctx: EventContext): ValidationResult {
  const errors: Record<string, string> = {};
  if (input.honeypot && input.honeypot.trim() !== '') {
    return { ok: false, errors: { honeypot: 'Spam erkannt.' } };
  }
  if (!input.firstName?.trim()) errors.firstName = 'Bitte gib deinen Vornamen an.';
  if (!input.lastName?.trim()) errors.lastName = 'Bitte gib deinen Nachnamen an.';
  if (!isValidEmail(input.email)) errors.email = 'Bitte gib eine gültige E-Mail-Adresse an.';
  if (!input.privacyConsent) errors.privacyConsent = 'Bitte stimme der Datenschutzerklärung zu.';
  if (!input.therapyConsent) errors.therapyConsent = 'Bitte bestätige den Hinweis zur Abgrenzung von Therapie.';
  if (ctx.event.status !== 'open') errors.event = 'Für diese Veranstaltung ist keine Anmeldung möglich.';
  if (ctx.now.getTime() > ctx.event.registrationDeadline.getTime()) errors.deadline = 'Die Anmeldefrist ist abgelaufen.';
  if (ctx.now.getTime() > ctx.event.date.getTime()) errors.event = 'Diese Veranstaltung liegt in der Vergangenheit.';
  if (ctx.currentCount >= ctx.event.capacity) errors.capacity = 'Diese Veranstaltung ist bereits ausgebucht.';
  return { ok: Object.keys(errors).length === 0, errors };
}
