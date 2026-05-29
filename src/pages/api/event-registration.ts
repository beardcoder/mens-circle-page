import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getCollection } from 'astro:content';
import { validateEventRegistration } from '../../lib/validation/event-registration';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const slug = String(form.get('eventSlug') ?? '');
  const input = {
    firstName: String(form.get('firstName') ?? '').trim(),
    lastName: String(form.get('lastName') ?? '').trim(),
    email: String(form.get('email') ?? '').trim().toLowerCase(),
    phone: String(form.get('phone') ?? '').trim(),
    message: String(form.get('message') ?? '').trim(),
    privacyConsent: form.get('privacyConsent') === 'yes',
    therapyConsent: form.get('therapyConsent') === 'yes',
    honeypot: String(form.get('company') ?? ''),
  };

  const events = await getCollection('events');
  const event = events.find((e) => e.id === slug);
  if (!event) return redirect(`/veranstaltungen?regerror=1`, 303);

  const db = env.DB;
  const countRow = await db.prepare(
    'SELECT COUNT(*) AS c FROM event_registrations WHERE event_slug = ?'
  ).bind(slug).first<{ c: number }>();
  const currentCount = countRow?.c ?? 0;

  const result = validateEventRegistration(input, {
    now: new Date(),
    event: {
      status: event.data.status,
      date: event.data.date,
      registrationDeadline: event.data.registrationDeadline,
      capacity: event.data.capacity,
    },
    currentCount,
  });

  if (!result.ok) {
    // Honeypot: pretend success, never reveal the trap.
    if (result.errors.honeypot) return redirect('/danke?type=event', 303);
    return redirect(`/veranstaltungen/${slug}?regerror=1#anmeldung`, 303);
  }

  await db.prepare(
    `INSERT INTO event_registrations
       (event_slug, first_name, last_name, email, phone, message, privacy_consent, therapy_disclaimer_consent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?)`
  ).bind(
    slug, input.firstName, input.lastName, input.email,
    input.phone || null, input.message || null, new Date().toISOString()
  ).run();

  return redirect('/danke?type=event', 303);
};
