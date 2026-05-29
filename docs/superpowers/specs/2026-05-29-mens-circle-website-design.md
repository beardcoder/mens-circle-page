# Männerkreis Website — Design Spec

**Date:** 2026-05-29
**Status:** Approved pending user review

## 1. Purpose & Scope

New, fully self-contained website for the Männerkreis (men's circle) in Raum
Straubing / Geiselhöring / Niederbayern, facilitated by Markus Sommer. Inspired
in *content* by https://mens-circle.de/ but not a 1:1 copy: rebuilt as a calm,
warm, fast, sustainable, cookie-free multi-page site.

Voice: *"Weniger Fassade. Mehr Wahrheit. Mehr Verbindung."* Grounded, warm,
professional. No coaching-sales loudness, no loud effects.

## 2. Design Language

- **Palette (oklch-friendly hex):** paper `#F7F3EC` (bg), warm charcoal
  `#22201D` (text), terracotta/clay `#A8553B` (primary accent), muted olive
  `#5A6650` (secondary), soft border `#E3DCCF`.
- **Typography:** system font stacks only — zero downloaded bytes, zero privacy
  surface. Headings: `ui-serif, Georgia, "Times New Roman", serif`. Body:
  `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Generous
  line-height (~1.65), measure ~68ch, mobile-first fluid type with `clamp()`.
- **Motion:** CSS-first transitions; one tiny IntersectionObserver for
  scroll-reveal as progressive enhancement (page fully usable without JS).
  Subtle: ~8px rise + fade, soft hover. Everything gated behind
  `@media (prefers-reduced-motion: reduce)` (no transforms/opacity transitions
  when reduced). No parallax, no autoplay, no large motion.
- **No heavy UI library.** Hand-written semantic HTML + scoped CSS (Astro
  `<style>`), minimal shared CSS variables in a global stylesheet.

## 3. Tech Architecture

- **Astro + TypeScript**, package manager **Bun**.
- **Adapter:** `@astrojs/cloudflare`, `output: 'server'`, with
  `export const prerender = true` on every content page → static HTML at the
  edge; the server runtime is used only by the two form endpoints.
- **Hosting:** Cloudflare Pages. D1 bound as `DB` via `locals.runtime.env.DB`.
- **Sitemap:** `@astrojs/sitemap`. **robots.txt** static in `public/`.

### Content Collections (`src/content/`)
- `events/*.md(x)` — see fields in §6.
- `blog/*.md(x)` — Impulse: title, date, excerpt, author, heroImage?, tags?, body.
- `faq/*.md` — question, answer (body), order, category?.
- `testimonials/*.md` — author, role/when?, quote (body), order.
- `settings` — single data entry (`src/content/settings/site.json` or
  `config.yml`-managed): site title, tagline, region, contact email,
  social/WhatsApp link, impressum/datenschutz operator fields, default OG image.

### Pages (`src/pages/`)
- `/` Startseite — hero, intro, Ablauf teaser, Archetypen, next events,
  testimonials, newsletter CTA.
- `/veranstaltungen` — list of events (upcoming first, past dimmed).
- `/veranstaltungen/[slug]` — event detail + registration form.
- `/veranstaltungen/[slug].ics` — prerendered calendar export (zero JS).
- `/blog` and `/blog/[slug]` — Impulse list + article.
- `/faq` — accordion via native `<details>` (no JS).
- `/ueber` — about, facilitator bio, Der Ablauf (4 phases), Archetypen-Kompass.
- `/newsletter` — dedicated newsletter page (form also embedded in footer).
- `/danke` — generic success page (query param distinguishes event vs newsletter
  message; no tracking).
- `/impressum`, `/datenschutz` — placeholder legal pages (clearly marked TODO
  for operator data), datenschutz documents the cookie-free setup.
- `/admin` — Sveltia CMS (static `index.html` + `config.yml`).

### API Routes (server, non-prerendered)
- `POST /api/event-registration`
- `POST /api/newsletter`

Both: server-side validation, honeypot, plain HTML `<form>` POST fallback that
works without JS; on success HTTP redirect (303) → `/danke`. Validation logic
lives in plain, unit-testable TS modules (`src/lib/validation/*`) independent of
the request handler.

## 4. Privacy / DSGVO (cookie-free operation)

Hard requirements, all enforced:
- No cookies, no `localStorage`/`sessionStorage` for tracking.
- No analytics, GTM, marketing pixels, no third-party scripts in frontend.
- No external fonts, no Google Maps / YouTube / social embeds.
- No external captcha, no Cloudflare Turnstile by default (honeypot only).
- No durable storage of IP address, user-agent, or tracking IDs in D1 or logs.
- Newsletter and event registration kept fully separate (separate tables,
  separate forms, separate consent).
- No pre-checked checkboxes.
- Therefore: **no cookie banner needed.**

## 5. D1 Schema (`DB` binding)

`schema.sql` + `migrations/0001_init.sql`. Example `wrangler.toml` with the `DB`
binding. Timestamps stored as ISO-8601 text (UTC).

### `event_registrations`
| column | type | notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| event_slug | TEXT NOT NULL | matches content collection slug |
| first_name | TEXT NOT NULL | |
| last_name | TEXT NOT NULL | |
| email | TEXT NOT NULL | |
| phone | TEXT | optional |
| message | TEXT | optional |
| privacy_consent | INTEGER NOT NULL | 1 = consented |
| therapy_disclaimer_consent | INTEGER NOT NULL | 1 = consented |
| created_at | TEXT NOT NULL | ISO-8601 UTC |

Indexes: `idx_reg_event_slug (event_slug)`, `idx_reg_email (email)`.

### `newsletter_subscribers`
| column | type | notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| email | TEXT NOT NULL UNIQUE | dedupe |
| first_name | TEXT | optional |
| status | TEXT NOT NULL DEFAULT 'pending' | `pending`/`confirmed`/`unsubscribed` |
| confirm_token | TEXT | for double-opt-in (structural) |
| privacy_consent | INTEGER NOT NULL | |
| created_at | TEXT NOT NULL | ISO-8601 UTC |
| confirmed_at | TEXT | set when confirmed |

Indexes: unique on `email`, `idx_news_status (status)`,
`idx_news_token (confirm_token)`.

Double-opt-in is **structurally prepared** (status + token columns, token
generated on signup) but no external email sender is wired; the send step is a
documented TODO stub.

## 6. Event Fields & Registration Logic

Event frontmatter:
`title`, `date` (start datetime), `endTime`, `locationName`
("Raum am Wirtsberg, Geiselhöring"), `addressNote`
("Genaue Adresse erhältst du nach der Anmeldung"), `capacity` (int, e.g. 8),
`donationHint` ("Spendenbasis · Richtwert 20–35 €"), `theme`
("Klarheit & Verbindung"), `status` (`open`/`closed`/`cancelled`),
`registrationDeadline` (datetime), `heroImage?`, `excerpt`, `agenda` (string[]),
MDX body.

Registration accepted only if **all** true:
1. Event exists and `status === 'open'`.
2. Now ≤ `registrationDeadline` (and event date not past).
3. Current confirmed registration count `< capacity`.
4. `privacy_consent` true **and** `therapy_disclaimer_consent` true.
5. Honeypot field empty.
6. Required fields present and email syntactically valid.

Otherwise the form shows a clear German error (re-rendered server-side) or the
detail page shows a "Anmeldung nicht mehr möglich" state for past/closed events.

Newsletter accepted only if: valid email, `privacy_consent` true, honeypot
empty. Duplicate email handled gracefully (no error leak — idempotent success
message; existing row untouched).

## 7. CMS — Sveltia at `/admin`

`public/admin/index.html` loads Sveltia CMS; `public/admin/config.yml` defines:
- **Backend:** `git-gateway`-free GitHub backend (`backend: { name: github,
  repo: <owner>/<repo>, branch: main }`) + `local_backend: true` for dev.
  OAuth provider wiring documented in README (operator sets up later).
- **Media:** `public/uploads` (or `src/assets`), public path configured.
- **Collections:** events, blog, faq, testimonials, settings (file collection,
  single entry). Fields mirror §3/§6, with `widget` types (string, datetime,
  number, boolean, markdown, list, image, select for status).
- No pre-selected/locked privacy implications; CMS is editor-only, not visitor
  facing.

## 8. Seed Content

- **2 events:** one upcoming `open` (future date, registration enabled), one
  past/`closed` (based on 2026-05-02 "Männerkreis-Abend", registration disabled).
- **2 blog posts** (Impulse): short grounded reflections.
- **~6 FAQ** entries (seeded from analyzed site: für wen / nicht geeignet / wo &
  wie oft / Ablauf / Kosten/Spende / Vertraulichkeit / Therapie-Abgrenzung).
- **3 testimonials:** Andy, KB, Johannes (paraphrased/cleaned, not verbatim
  marketing).
- **Site settings:** title, tagline, region, contact, WhatsApp link placeholder,
  legal operator placeholders.

## 9. SEO & Quality

- Central `<SEO>`/`<BaseHead>` Astro component: title, description, canonical,
  Open Graph + Twitter card, locale `de_DE`, default + per-page OG image.
- JSON-LD `Event` structured data on event detail pages.
- `@astrojs/sitemap`, static `robots.txt` (allow all, points to sitemap).
- Semantic HTML5 landmarks, skip-link, labelled form controls, visible focus
  states, sufficient contrast (palette chosen for WCAG AA on body text),
  `lang="de"`.
- Performance: static prerender, no client JS except the tiny optional
  scroll-reveal + native `<details>`; images lazy + sized.

## 10. Tooling & Deliverables

- Bun scripts: `bun install`, `bun run dev`, `bun run build`, `bun run preview`.
- `.env.example` (Cloudflare account/D1 hints, OAuth client id placeholders).
- **German README** covering: project overview, Bun commands, Cloudflare + D1
  setup (create DB, apply migrations local & remote, bind `DB`, deploy to
  Pages), how event & newsletter submissions work, and a
  **"Cookie-freier Betrieb / DSGVO-arme Konfiguration"** section.
- `wrangler.toml` example, `schema.sql`, `migrations/`.

## 11. QA Strategy (Superpowers)

- **TDD** for validation modules and the two endpoints (event-registration:
  status/deadline/capacity/consent/honeypot; newsletter: email/consent/dedupe).
  Tests run under Bun's test runner against the pure validation modules; D1
  access mocked at the boundary.
- **verification-before-completion**: run `bun run build` and a local
  `bun run dev` smoke check before declaring done; report real output.
- **requesting-code-review** before finishing the branch.

## 12. Non-Goals (YAGNI)

- No actual transactional email sending (structural double-opt-in only).
- No payment/donation processing (donation is informational text).
- No user accounts / auth on the public site.
- No multi-language (German only).
- No Turnstile/captcha unless operator opts in later (documented).

## Open Questions (defaults assumed if unanswered)
1. Sveltia backend = GitHub repo, operator wires OAuth later. (default: yes)
2. Copy keeps explicit "Straubing / Geiselhöring / Niederbayern". (default: yes)
3. Newsletter confirm-email send left as documented TODO stub. (default: yes)
