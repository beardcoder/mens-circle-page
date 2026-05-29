import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { validateNewsletter } from "../../lib/validation/newsletter";
import { generateToken } from "../../lib/token";

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const input = {
    email: String(form.get("email") ?? "")
      .trim()
      .toLowerCase(),
    firstName: String(form.get("firstName") ?? "").trim(),
    privacyConsent: form.get("privacyConsent") === "yes",
    honeypot: String(form.get("company") ?? ""),
  };
  const result = validateNewsletter(input);
  if (!result.ok) {
    // Honeypot: pretend success, never reveal the trap.
    if (result.errors.honeypot) return redirect("/danke?type=newsletter", 303);
    return redirect("/newsletter?nlerror=1", 303);
  }
  const db = env.DB;
  const now = new Date().toISOString();
  const token = generateToken();
  // Idempotent: duplicates ignored via UNIQUE(email).
  await db
    .prepare(
      `INSERT INTO newsletter_subscribers (email, first_name, status, confirm_token, privacy_consent, created_at)
     VALUES (?, ?, 'pending', ?, 1, ?)
     ON CONFLICT(email) DO NOTHING`,
    )
    .bind(input.email, input.firstName || null, token, now)
    .run();
  // TODO (Double-Opt-In): hier Bestätigungs-E-Mail mit Token-Link senden.
  // Strukturell vorbereitet (status='pending', confirm_token); kein externer Versand angebunden.
  return redirect("/danke?type=newsletter", 303);
};
