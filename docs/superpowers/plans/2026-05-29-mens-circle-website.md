# Männerkreis Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a calm, fast, cookie-free multi-page Astro website for the Männerkreis with CMS-editable content, D1-backed event registration and newsletter signup, and full DSGVO-arme configuration.

**Architecture:** Astro + TypeScript on Cloudflare Pages with `@astrojs/cloudflare` adapter (`output: 'server'`, content pages prerendered). Content via Markdown/MDX Content Collections. Two server API routes write to Cloudflare D1 (`DB` binding). Pure, unit-tested validation modules sit behind the request handlers. Sveltia CMS at `/admin`. Zero client JS beyond a tiny optional scroll-reveal and native `<details>`.

**Tech Stack:** Astro, TypeScript, Bun, `@astrojs/cloudflare`, `@astrojs/sitemap`, `@astrojs/mdx`, Cloudflare D1 + wrangler, Sveltia CMS, system fonts, scoped CSS.

---

## File Structure

```
mens-circle-clean/
├── astro.config.mjs            # Astro + cloudflare adapter + mdx + sitemap
├── wrangler.toml               # Cloudflare Pages + D1 binding (DB)
├── tsconfig.json
├── package.json                # bun scripts
├── .env.example
├── .gitignore
├── README.md                   # German docs
├── schema.sql                  # full D1 schema (convenience)
├── migrations/
│   └── 0001_init.sql           # D1 migration
├── public/
│   ├── robots.txt
│   ├── favicon.svg
│   ├── og-default.svg
│   └── admin/
│       ├── index.html          # Sveltia CMS loader
│       └── config.yml          # CMS collections
├── src/
│   ├── content.config.ts       # collection schemas (events, blog, faq, testimonials, settings)
│   ├── content/
│   │   ├── events/             # 2 seed events
│   │   ├── blog/               # 2 seed posts
│   │   ├── faq/                # ~6 seed entries
│   │   ├── testimonials/       # 3 seed entries
│   │   └── settings/site.json  # site settings single entry
│   ├── lib/
│   │   ├── datetime.ts         # date helpers (format de-DE, isPast)
│   │   ├── ics.ts              # build .ics string for an event
│   │   ├── token.ts            # confirm token generation
│   │   └── validation/
│   │       ├── email.ts        # isValidEmail
│   │       ├── event-registration.ts  # validateEventRegistration
│   │       └── newsletter.ts          # validateNewsletter
│   ├── layouts/
│   │   └── BaseLayout.astro    # html shell, header, footer, SEO slot
│   ├── components/
│   │   ├── BaseHead.astro      # meta/OG/canonical/JSON-LD slot
│   │   ├── Header.astro
│   │   ├── Footer.astro        # includes newsletter mini-form
│   │   ├── EventCard.astro
│   │   ├── TestimonialCard.astro
│   │   ├── EventRegistrationForm.astro
│   │   └── NewsletterForm.astro
│   ├── styles/
│   │   └── global.css          # variables, reset, typography, motion
│   └── pages/
│       ├── index.astro
│       ├── veranstaltungen/index.astro
│       ├── veranstaltungen/[slug].astro
│       ├── veranstaltungen/[slug].ics.ts
│       ├── blog/index.astro
│       ├── blog/[slug].astro
│       ├── faq.astro
│       ├── ueber.astro
│       ├── newsletter.astro
│       ├── danke.astro
│       ├── impressum.astro
│       ├── datenschutz.astro
│       └── api/
│           ├── event-registration.ts
│           └── newsletter.ts
└── tests/
    ├── email.test.ts
    ├── event-registration.test.ts
    ├── newsletter.test.ts
    ├── datetime.test.ts
    └── ics.test.ts
```

---

## Task 1: Scaffold project with Bun + Astro + Cloudflare

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `src/env.d.ts`

- [ ] **Step 1: Init package and install deps**

```bash
cd /Users/markus.sommer/Projekte/Privat/mens-circle-clean
bun init -y
bun add astro @astrojs/cloudflare @astrojs/mdx @astrojs/sitemap
```

- [ ] **Step 2: Write `package.json` scripts** (merge into generated file)

```json
{
  "name": "mens-circle",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "test": "bun test"
  }
}
```

- [ ] **Step 3: Write `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://maennerkreis.example',
  output: 'static',
  adapter: cloudflare({ platformProxy: { enabled: true } }),
  integrations: [mdx(), sitemap({ filter: (p) => !p.includes('/admin') })],
});
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "types": ["@astrojs/cloudflare"],
    "strictNullChecks": true
  }
}
```

- [ ] **Step 5: Write `src/env.d.ts`**

```ts
/// <reference path="../.astro/types.d.ts" />
type Runtime = import('@astrojs/cloudflare').Runtime<Env>;
interface Env {
  DB: D1Database;
}
declare namespace App {
  interface Locals extends Runtime {}
}
```

- [ ] **Step 6: Write `.gitignore`**

```
node_modules/
dist/
.astro/
.wrangler/
.dev.vars
*.local
.env
```

- [ ] **Step 7: Verify build tooling runs**

Run: `bun run astro -- --version`
Expected: prints Astro version, no error.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: scaffold Astro + Cloudflare + Bun project"
```

---

## Task 2: Global styles (palette, typography, motion)

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Write `src/styles/global.css`**

```css
:root {
  --paper: #f7f3ec;
  --ink: #22201d;
  --ink-soft: #4a463f;
  --clay: #a8553b;
  --clay-dark: #8c4530;
  --olive: #5a6650;
  --border: #e3dccf;
  --surface: #fffdf8;
  --max: 68ch;
  --serif: ui-serif, Georgia, "Times New Roman", serif;
  --sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  --radius: 10px;
  --space: clamp(1rem, 2vw, 1.5rem);
}

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--sans);
  font-size: clamp(1.05rem, 0.5vw + 1rem, 1.2rem);
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3 { font-family: var(--serif); line-height: 1.2; font-weight: 600; }
h1 { font-size: clamp(2rem, 4vw + 1rem, 3.2rem); }
h2 { font-size: clamp(1.5rem, 2vw + 1rem, 2.2rem); }
a { color: var(--clay-dark); text-underline-offset: 3px; }
a:hover { color: var(--clay); }
img { max-width: 100%; height: auto; display: block; }

.container { width: min(72rem, 100% - 2.5rem); margin-inline: auto; }
.prose { max-width: var(--max); }
.prose > * + * { margin-block-start: 1em; }

:focus-visible { outline: 3px solid var(--clay); outline-offset: 2px; }
.skip-link {
  position: absolute; left: -999px; top: 0; background: var(--ink); color: var(--paper);
  padding: .6rem 1rem; z-index: 100;
}
.skip-link:focus { left: .5rem; top: .5rem; }

.btn {
  display: inline-block; background: var(--clay); color: #fff; border: 0;
  padding: .8rem 1.4rem; border-radius: var(--radius); font: inherit; font-weight: 600;
  cursor: pointer; text-decoration: none; transition: background .2s ease, transform .2s ease;
}
.btn:hover { background: var(--clay-dark); color: #fff; transform: translateY(-1px); }
.btn--ghost { background: transparent; color: var(--ink); border: 1px solid var(--border); }

.reveal { opacity: 0; transform: translateY(8px); transition: opacity .6s ease, transform .6s ease; }
.reveal.is-visible { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { transition: none !important; animation: none !important; }
  .reveal { opacity: 1; transform: none; }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css && git commit -m "feat: global styles, palette, typography, motion"
```

---

## Task 3: BaseHead (SEO) and BaseLayout

**Files:**
- Create: `src/components/BaseHead.astro`, `src/layouts/BaseLayout.astro`, `src/components/Header.astro`, `src/components/Footer.astro`

- [ ] **Step 1: Write `src/components/BaseHead.astro`**

```astro
---
interface Props {
  title: string;
  description: string;
  image?: string;
  type?: string;
}
const { title, description, image = '/og-default.svg', type = 'website' } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site);
const ogImage = new URL(image, Astro.site);
---
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<meta property="og:type" content={type} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
<meta property="og:image" content={ogImage} />
<meta property="og:locale" content="de_DE" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="robots" content="index, follow" />
<slot />
```

- [ ] **Step 2: Write `src/components/Header.astro`**

```astro
---
const links = [
  { href: '/veranstaltungen', label: 'Veranstaltungen' },
  { href: '/ueber', label: 'Über' },
  { href: '/blog', label: 'Impulse' },
  { href: '/faq', label: 'Fragen' },
  { href: '/newsletter', label: 'Newsletter' },
];
const path = Astro.url.pathname;
---
<header class="site-header">
  <div class="container bar">
    <a href="/" class="brand">Männerkreis</a>
    <nav aria-label="Hauptnavigation">
      <ul>
        {links.map((l) => (
          <li><a href={l.href} aria-current={path.startsWith(l.href) ? 'page' : undefined}>{l.label}</a></li>
        ))}
      </ul>
    </nav>
  </div>
</header>
<style>
  .site-header { border-bottom: 1px solid var(--border); background: var(--paper); position: sticky; top: 0; z-index: 20; }
  .bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-block: .9rem; flex-wrap: wrap; }
  .brand { font-family: var(--serif); font-weight: 600; font-size: 1.3rem; text-decoration: none; color: var(--ink); }
  nav ul { display: flex; gap: 1.1rem; list-style: none; margin: 0; padding: 0; flex-wrap: wrap; }
  nav a { text-decoration: none; color: var(--ink-soft); }
  nav a[aria-current="page"] { color: var(--clay-dark); font-weight: 600; }
</style>
```

- [ ] **Step 3: Write `src/components/Footer.astro`** (newsletter form added in Task 11; placeholder text for now)

```astro
---
import NewsletterForm from './NewsletterForm.astro';
const year = new Date().getFullYear();
---
<footer class="site-footer">
  <div class="container grid">
    <div>
      <p class="brand">Männerkreis</p>
      <p>Weniger Fassade. Mehr Wahrheit. Mehr Verbindung.</p>
      <p>Raum Straubing · Geiselhöring · Niederbayern</p>
    </div>
    <div>
      <h2>Newsletter</h2>
      <NewsletterForm compact={true} />
    </div>
    <nav aria-label="Rechtliches">
      <ul>
        <li><a href="/impressum">Impressum</a></li>
        <li><a href="/datenschutz">Datenschutz</a></li>
      </ul>
    </nav>
  </div>
  <p class="copy">© {year} Männerkreis · Cookie-frei, ohne Tracking</p>
</footer>
<style>
  .site-footer { margin-top: 4rem; border-top: 1px solid var(--border); background: var(--surface); padding-block: 2.5rem 1.5rem; }
  .grid { display: grid; gap: 2rem; grid-template-columns: 1fr; }
  @media (min-width: 48rem) { .grid { grid-template-columns: 1.5fr 1.5fr 1fr; } }
  .brand { font-family: var(--serif); font-size: 1.2rem; margin: 0 0 .3rem; }
  ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .4rem; }
  .copy { text-align: center; color: var(--ink-soft); font-size: .9rem; margin-top: 2rem; }
</style>
```

- [ ] **Step 4: Write `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';
import BaseHead from '../components/BaseHead.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
interface Props { title: string; description: string; image?: string; type?: string; }
const { title, description, image, type } = Astro.props;
---
<!doctype html>
<html lang="de">
  <head>
    <BaseHead title={title} description={description} image={image} type={type}>
      <slot name="head" />
    </BaseHead>
  </head>
  <body>
    <a href="#main" class="skip-link">Zum Inhalt springen</a>
    <Header />
    <main id="main">
      <slot />
    </main>
    <Footer />
    <script>
      const els = document.querySelectorAll('.reveal');
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
        }, { threshold: 0.12 });
        els.forEach((el) => io.observe(el));
      } else {
        els.forEach((el) => el.classList.add('is-visible'));
      }
    </script>
  </body>
</html>
```

- [ ] **Step 5: Verify dev server boots** (Footer imports NewsletterForm which doesn't exist yet — create a temporary minimal stub to keep build green, replaced in Task 11)

Create temporary `src/components/NewsletterForm.astro`:

```astro
---
interface Props { compact?: boolean }
const { compact = false } = Astro.props;
---
<p>{compact ? 'Newsletter folgt.' : 'Newsletter folgt.'}</p>
```

Run: `bun run build`
Expected: build succeeds (no pages yet is fine; if Astro errors on zero pages, proceed — Task 4 adds pages).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: BaseHead SEO, BaseLayout, Header, Footer"
```

---

## Task 4: Content collection schemas

**Files:**
- Create: `src/content.config.ts`

- [ ] **Step 1: Write `src/content.config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const events = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/events' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    date: z.coerce.date(),
    endTime: z.string(),
    locationName: z.string(),
    addressNote: z.string().default('Die genaue Adresse erhältst du nach der Anmeldung.'),
    capacity: z.number().int().positive(),
    donationHint: z.string().default('Spendenbasis · Richtwert 20–35 €'),
    theme: z.string().optional(),
    status: z.enum(['open', 'closed', 'cancelled']).default('open'),
    registrationDeadline: z.coerce.date(),
    heroImage: image().optional(),
    excerpt: z.string(),
    agenda: z.array(z.string()).default([]),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    author: z.string().default('Markus Sommer'),
    heroImage: image().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq' }),
  schema: z.object({
    question: z.string(),
    order: z.number().default(0),
    category: z.string().optional(),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/testimonials' }),
  schema: z.object({
    author: z.string(),
    context: z.string().optional(),
    order: z.number().default(0),
  }),
});

const settings = defineCollection({
  loader: file('./src/content/settings/site.json'),
  schema: z.object({
    id: z.string(),
    siteTitle: z.string(),
    tagline: z.string(),
    region: z.string(),
    contactEmail: z.string(),
    whatsappUrl: z.string().optional(),
    operatorName: z.string(),
    operatorAddress: z.string(),
  }),
});

export const collections = { events, blog, faq, testimonials, settings };
```

- [ ] **Step 2: Verify schema typechecks**

Run: `bun run astro -- sync`
Expected: "Generated types" / no schema error (content dirs may be empty — that's fine).

- [ ] **Step 3: Commit**

```bash
git add src/content.config.ts && git commit -m "feat: content collection schemas"
```

---

## Task 5: Seed content

**Files:**
- Create: `src/content/settings/site.json`, two events, two blog posts, six FAQ, three testimonials.

- [ ] **Step 1: Write `src/content/settings/site.json`**

```json
{
  "id": "site",
  "siteTitle": "Männerkreis",
  "tagline": "Weniger Fassade. Mehr Wahrheit. Mehr Verbindung.",
  "region": "Raum Straubing · Geiselhöring · Niederbayern",
  "contactEmail": "kontakt@example.de",
  "whatsappUrl": "",
  "operatorName": "Markus Sommer",
  "operatorAddress": "Platzhalter Straße 1, 94315 Straubing"
}
```

- [ ] **Step 2: Write `src/content/events/2026-09-19-klarheit-und-verbindung.md`** (upcoming, open)

```md
---
title: "Männerkreis-Abend: Klarheit & Verbindung"
date: 2026-09-19T19:30:00+02:00
endTime: "22:00"
locationName: "Raum am Wirtsberg, Geiselhöring"
capacity: 8
theme: "Klarheit & Verbindung"
status: "open"
registrationDeadline: 2026-09-17T20:00:00+02:00
excerpt: "Ein geschützter Abend für Männer: Atem, ehrliches Zuhören und ein konkreter nächster Schritt."
agenda:
  - "Ankommen, Rahmen & Zustimmung"
  - "Atemarbeit und Check-in"
  - "Aktives Zuhören & Spiegelung"
  - "Körperarbeit, Klärung & Integration"
---

Ein geschützter Raum für Männer aus der Region. Wir arbeiten mit Atem, aktivem
Zuhören und respektvoller Spiegelung. Über den Archetypen-Kompass — Krieger,
Liebhaber, Zauberer, König, weiser Vater — finden wir einen konkreten nächsten
Schritt für den Alltag.

Der Abend folgt einer klaren Struktur und dauert etwa zweieinhalb Stunden.
Vertraulichkeit ist Grundlage: Was im Kreis geteilt wird, bleibt im Kreis.
```

- [ ] **Step 3: Write `src/content/events/2026-05-02-maennerkreis-abend.md`** (past, closed)

```md
---
title: "Männerkreis-Abend"
date: 2026-05-02T19:30:00+02:00
endTime: "22:00"
locationName: "Raum am Wirtsberg, Geiselhöring"
capacity: 8
theme: "Klarheit & Verbindung"
status: "closed"
registrationDeadline: 2026-04-30T20:00:00+02:00
excerpt: "Vergangener Abend zu Klarheit und Verbindung."
agenda:
  - "Ankommen, Rahmen & Zustimmung"
  - "Atemarbeit und Check-in"
  - "Aktives Zuhören & Spiegelung"
  - "Körperarbeit, Klärung & Integration"
---

Ein vergangener Männerkreis-Abend. Wir trafen uns für Atemarbeit, ehrliches
Zuhören und Archetypen-Reflexion. Für kommende Termine trag dich gern in den
Newsletter ein.
```

- [ ] **Step 4: Write two blog posts** `src/content/blog/2026-03-10-was-bedeutet-staerke.md` and `src/content/blog/2026-04-22-zuhoeren-als-praxis.md`

```md
---
title: "Was bedeutet Stärke wirklich?"
date: 2026-03-10
excerpt: "Stärke heißt nicht, alles im Griff zu haben — sondern klar zu führen, offen zuzuhören und verantwortlich zu handeln."
tags: ["Impuls", "Archetypen"]
---

Viele verbinden Stärke mit Härte. Im Kreis erleben wir etwas anderes: Stärke
zeigt sich, wenn ein Mann Grenzen setzen **und** Nähe zulassen kann.

Der Krieger handelt, der Liebhaber fühlt, der König trägt Verantwortung. Keiner
allein genügt. Reife entsteht, wo sie zusammenkommen.
```

```md
---
title: "Zuhören als Praxis"
date: 2026-04-22
excerpt: "Echtes Zuhören ist kein passives Schweigen, sondern eine aktive, übbare Fähigkeit."
tags: ["Impuls", "Praxis"]
---

Wir üben Zuhören ohne vorschnelle Ratschläge, ohne Bewertung, mit möglichst
wenig Projektion. Das klingt einfach und ist überraschend schwer.

Wer wirklich zuhört, gibt dem anderen Raum — und sich selbst die Chance, etwas
Neues zu hören.
```

- [ ] **Step 5: Write six FAQ files** in `src/content/faq/` (`01-fuer-wen.md` … `06-therapie.md`)

```md
---
question: "Für wen ist der Männerkreis?"
order: 1
---
Für Männer aus dem Raum Straubing, Geiselhöring und Niederbayern, die bereit sind, ehrlich mit sich selbst zu arbeiten.
```
```md
---
question: "Für wen ist der Männerkreis nicht geeignet?"
order: 2
---
Nicht passend ist der Kreis, wenn du nur konsumieren willst, andere belehren möchtest oder gerade eine akute psychische Krise hast.
```
```md
---
question: "Wo und wie oft findet der Männerkreis statt?"
order: 3
---
Wir treffen uns im Raum Straubing beziehungsweise Geiselhöring. Die Termine finden unregelmäßig statt, meist alle paar Wochen oder Monate.
```
```md
---
question: "Wie läuft ein Treffen ab?"
order: 4
---
Ein Abend dauert etwa zweieinhalb Stunden und folgt einer klaren Struktur: Ankommen, Atemarbeit, Check-in, Prozessarbeit, Archetypen-Reflexion, Feedback und Integration.
```
```md
---
question: "Was kostet die Teilnahme?"
order: 5
---
Die Teilnahme läuft auf Spendenbasis. Du gibst den Betrag, der für dich stimmig und möglich ist.
```
```md
---
question: "Ist der Männerkreis Therapie oder Coaching?"
order: 6
---
Nein. Der Männerkreis ist ein Entwicklungs- und Erfahrungsraum, aber kein Ersatz für Psychotherapie, Coaching, ärztliche Behandlung oder Krisenhilfe.
```

- [ ] **Step 6: Write three testimonials** `src/content/testimonials/01-andy.md`, `02-kb.md`, `03-johannes.md`

```md
---
author: "Andy"
context: "Teilnehmer seit Oktober 2024"
order: 1
---
Unabhängig von der Gruppengröße entsteht jedes Mal ein besonderer Abend. Jeder Besuch war für mich nährend und erkenntnisreich.
```
```md
---
author: "KB"
context: "Erster Besuch"
order: 2
---
Ich war erst vor Kurzem das erste Mal dabei und fand es sehr gut. Die Zeit ist wirklich schnell verflogen.
```
```md
---
author: "Johannes"
context: "Teilnehmer"
order: 3
---
Ein kompetenter Raumhalter ermöglicht mir einen Austausch, in dem ich den inneren Wettbewerbs-Modus stoppen und wertvolle Erfahrungen machen kann.
```

- [ ] **Step 7: Verify content loads**

Run: `bun run astro -- sync`
Expected: types generated, no schema validation errors.

- [ ] **Step 8: Commit**

```bash
git add src/content && git commit -m "feat: seed content (events, blog, faq, testimonials, settings)"
```

---

## Task 6: Datetime + ICS helpers (TDD)

**Files:**
- Create: `src/lib/datetime.ts`, `src/lib/ics.ts`
- Test: `tests/datetime.test.ts`, `tests/ics.test.ts`

- [ ] **Step 1: Write failing test `tests/datetime.test.ts`**

```ts
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
```

- [ ] **Step 2: Run test, expect fail**

Run: `bun test tests/datetime.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/lib/datetime.ts`**

```ts
export function isPast(date: Date, now: Date = new Date()): boolean {
  return date.getTime() < now.getTime();
}

export function formatDateDe(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    timeZone: 'Europe/Berlin',
  }).format(date);
}

export function formatTimeDe(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin',
  }).format(date);
}
```

- [ ] **Step 4: Run test, expect pass**

Run: `bun test tests/datetime.test.ts`
Expected: PASS.

- [ ] **Step 5: Write failing test `tests/ics.test.ts`**

```ts
import { test, expect } from 'bun:test';
import { buildIcs } from '../src/lib/ics';

test('buildIcs contains VEVENT and title', () => {
  const ics = buildIcs({
    uid: 'evt-1@maennerkreis',
    title: 'Männerkreis-Abend',
    description: 'Test',
    location: 'Geiselhöring',
    start: new Date('2026-09-19T19:30:00+02:00'),
    end: new Date('2026-09-19T22:00:00+02:00'),
  });
  expect(ics).toContain('BEGIN:VEVENT');
  expect(ics).toContain('SUMMARY:Männerkreis-Abend');
  expect(ics).toContain('END:VCALENDAR');
});
```

- [ ] **Step 6: Run test, expect fail**

Run: `bun test tests/ics.test.ts`
Expected: FAIL.

- [ ] **Step 7: Write `src/lib/ics.ts`**

```ts
interface IcsEvent {
  uid: string; title: string; description: string; location: string;
  start: Date; end: Date;
}
function fmt(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
export function buildIcs(e: IcsEvent): string {
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Maennerkreis//DE',
    'BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${fmt(e.start)}`,
    `DTSTART:${fmt(e.start)}`, `DTEND:${fmt(e.end)}`,
    `SUMMARY:${esc(e.title)}`, `DESCRIPTION:${esc(e.description)}`,
    `LOCATION:${esc(e.location)}`, 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}
```

- [ ] **Step 8: Run tests, expect pass**

Run: `bun test tests/ics.test.ts tests/datetime.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/datetime.ts src/lib/ics.ts tests/datetime.test.ts tests/ics.test.ts
git commit -m "feat: datetime and ics helpers with tests"
```

---

## Task 7: Email + token utilities (TDD)

**Files:**
- Create: `src/lib/validation/email.ts`, `src/lib/token.ts`
- Test: `tests/email.test.ts`

- [ ] **Step 1: Write failing test `tests/email.test.ts`**

```ts
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
```

- [ ] **Step 2: Run test, expect fail**

Run: `bun test tests/email.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write `src/lib/validation/email.ts`**

```ts
const RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(value: string): boolean {
  return typeof value === 'string' && value.length <= 254 && RE.test(value);
}
```

- [ ] **Step 4: Run test, expect pass**

Run: `bun test tests/email.test.ts`
Expected: PASS.

- [ ] **Step 5: Write `src/lib/token.ts`** (uses Web Crypto, available in Workers + Bun)

```ts
export function generateToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/validation/email.ts src/lib/token.ts tests/email.test.ts
git commit -m "feat: email validation and token util with tests"
```

---

## Task 8: Event registration validation (TDD)

**Files:**
- Create: `src/lib/validation/event-registration.ts`
- Test: `tests/event-registration.test.ts`

- [ ] **Step 1: Write failing test `tests/event-registration.test.ts`**

```ts
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
```

- [ ] **Step 2: Run test, expect fail**

Run: `bun test tests/event-registration.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write `src/lib/validation/event-registration.ts`**

```ts
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
```

- [ ] **Step 4: Run test, expect pass**

Run: `bun test tests/event-registration.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation/event-registration.ts tests/event-registration.test.ts
git commit -m "feat: event registration validation with tests"
```

---

## Task 9: Newsletter validation (TDD)

**Files:**
- Create: `src/lib/validation/newsletter.ts`
- Test: `tests/newsletter.test.ts`

- [ ] **Step 1: Write failing test `tests/newsletter.test.ts`**

```ts
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
```

- [ ] **Step 2: Run test, expect fail**

Run: `bun test tests/newsletter.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write `src/lib/validation/newsletter.ts`**

```ts
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
```

- [ ] **Step 4: Run test, expect pass**

Run: `bun test tests/newsletter.test.ts`
Expected: PASS.

- [ ] **Step 5: Run full test suite**

Run: `bun test`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/validation/newsletter.ts tests/newsletter.test.ts
git commit -m "feat: newsletter validation with tests"
```

---

## Task 10: D1 schema, migrations, wrangler config

**Files:**
- Create: `schema.sql`, `migrations/0001_init.sql`, `wrangler.toml`, `.env.example`

- [ ] **Step 1: Write `migrations/0001_init.sql`**

```sql
CREATE TABLE IF NOT EXISTS event_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_slug TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  privacy_consent INTEGER NOT NULL,
  therapy_disclaimer_consent INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reg_event_slug ON event_registrations(event_slug);
CREATE INDEX IF NOT EXISTS idx_reg_email ON event_registrations(email);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  confirm_token TEXT,
  privacy_consent INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  confirmed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_news_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_news_token ON newsletter_subscribers(confirm_token);
```

- [ ] **Step 2: Copy schema to `schema.sql`** (identical content for convenience / fresh setup) — same SQL as Step 1.

- [ ] **Step 3: Write `wrangler.toml`**

```toml
name = "maennerkreis"
compatibility_date = "2025-01-01"
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB"
database_name = "maennerkreis-db"
database_id = "REPLACE_WITH_YOUR_D1_DATABASE_ID"
migrations_dir = "migrations"
```

- [ ] **Step 4: Write `.env.example`**

```
# Cloudflare (only needed for remote wrangler operations / CI)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# Sveltia CMS GitHub OAuth (set up on your auth provider / Pages function)
# OAUTH_GITHUB_CLIENT_ID=
# OAUTH_GITHUB_CLIENT_SECRET=
```

- [ ] **Step 5: Verify local D1 migration applies**

Run: `bunx wrangler d1 migrations apply maennerkreis-db --local`
Expected: prints applied migration `0001_init.sql` (creates local `.wrangler` state). If wrangler prompts about config, ensure `wrangler.toml` is present.

- [ ] **Step 6: Commit**

```bash
git add schema.sql migrations wrangler.toml .env.example
git commit -m "feat: D1 schema, migration, wrangler config, env example"
```

---

## Task 11: Newsletter form component + API route

**Files:**
- Modify/replace: `src/components/NewsletterForm.astro`
- Create: `src/pages/api/newsletter.ts`

- [ ] **Step 1: Replace `src/components/NewsletterForm.astro`**

```astro
---
interface Props { compact?: boolean }
const { compact = false } = Astro.props;
const error = Astro.url.searchParams.get('nlerror');
---
<form method="POST" action="/api/newsletter" class={compact ? 'nl nl--compact' : 'nl'}>
  <p class="hp" aria-hidden="true">
    <label>Bitte leer lassen<input type="text" name="company" tabindex="-1" autocomplete="off" /></label>
  </p>
  <div class="field">
    <label for="nl-email">E-Mail*</label>
    <input id="nl-email" type="email" name="email" required autocomplete="email" />
  </div>
  <div class="field">
    <label for="nl-first">Vorname (optional)</label>
    <input id="nl-first" type="text" name="firstName" autocomplete="given-name" />
  </div>
  <label class="consent">
    <input type="checkbox" name="privacyConsent" value="yes" required />
    <span>Ich stimme der <a href="/datenschutz">Datenschutzerklärung</a> zu.*</span>
  </label>
  {error && <p class="err" role="alert">Bitte prüfe deine Eingaben.</p>}
  <button class="btn" type="submit">Eintragen</button>
  <p class="note">Kein Spam. Abmeldung jederzeit möglich.</p>
</form>
<style>
  .nl { display: grid; gap: .8rem; max-width: 32rem; }
  .field { display: grid; gap: .3rem; }
  input[type="email"], input[type="text"] { padding: .6rem .7rem; border: 1px solid var(--border); border-radius: var(--radius); font: inherit; background: var(--surface); }
  .consent { display: flex; gap: .5rem; align-items: flex-start; font-size: .95rem; }
  .hp { position: absolute; left: -9999px; height: 0; overflow: hidden; }
  .err { color: var(--clay-dark); }
  .note { font-size: .85rem; color: var(--ink-soft); margin: 0; }
</style>
```

- [ ] **Step 2: Write `src/pages/api/newsletter.ts`**

```ts
import type { APIRoute } from 'astro';
import { validateNewsletter } from '../../lib/validation/newsletter';
import { generateToken } from '../../lib/token';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const form = await request.formData();
  const input = {
    email: String(form.get('email') ?? '').trim().toLowerCase(),
    firstName: String(form.get('firstName') ?? '').trim(),
    privacyConsent: form.get('privacyConsent') === 'yes',
    honeypot: String(form.get('company') ?? ''),
  };
  const result = validateNewsletter(input);
  if (!result.ok) {
    if (result.errors.honeypot) return redirect('/danke?type=newsletter', 303);
    return redirect('/newsletter?nlerror=1', 303);
  }
  const db = (locals as any).runtime.env.DB as D1Database;
  const now = new Date().toISOString();
  const token = generateToken();
  // Idempotent: ignore duplicates via UNIQUE(email)
  await db.prepare(
    `INSERT INTO newsletter_subscribers (email, first_name, status, confirm_token, privacy_consent, created_at)
     VALUES (?, ?, 'pending', ?, 1, ?)
     ON CONFLICT(email) DO NOTHING`
  ).bind(input.email, input.firstName || null, token, now).run();
  // TODO (double-opt-in): send confirmation email with token link. Structurally prepared; no external sender wired.
  return redirect('/danke?type=newsletter', 303);
};
```

- [ ] **Step 3: Verify build compiles**

Run: `bun run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/NewsletterForm.astro src/pages/api/newsletter.ts
git commit -m "feat: newsletter form and API route (D1, dedupe, opt-in prepared)"
```

---

## Task 12: Event registration form + API route

**Files:**
- Create: `src/components/EventRegistrationForm.astro`, `src/pages/api/event-registration.ts`

- [ ] **Step 1: Write `src/components/EventRegistrationForm.astro`**

```astro
---
interface Props { slug: string }
const { slug } = Astro.props;
const error = Astro.url.searchParams.get('regerror');
---
<form method="POST" action="/api/event-registration" class="reg">
  <input type="hidden" name="eventSlug" value={slug} />
  <p class="hp" aria-hidden="true">
    <label>Bitte leer lassen<input type="text" name="company" tabindex="-1" autocomplete="off" /></label>
  </p>
  <div class="row">
    <div class="field">
      <label for="r-first">Vorname*</label>
      <input id="r-first" name="firstName" required autocomplete="given-name" />
    </div>
    <div class="field">
      <label for="r-last">Nachname*</label>
      <input id="r-last" name="lastName" required autocomplete="family-name" />
    </div>
  </div>
  <div class="field">
    <label for="r-email">E-Mail*</label>
    <input id="r-email" type="email" name="email" required autocomplete="email" />
  </div>
  <div class="field">
    <label for="r-phone">Telefon (optional)</label>
    <input id="r-phone" type="tel" name="phone" autocomplete="tel" />
  </div>
  <div class="field">
    <label for="r-msg">Nachricht (optional)</label>
    <textarea id="r-msg" name="message" rows="4"></textarea>
  </div>
  <label class="consent">
    <input type="checkbox" name="privacyConsent" value="yes" required />
    <span>Ich stimme der <a href="/datenschutz">Datenschutzerklärung</a> zu.*</span>
  </label>
  <label class="consent">
    <input type="checkbox" name="therapyConsent" value="yes" required />
    <span>Mir ist bewusst, dass der Männerkreis kein Ersatz für Therapie oder medizinische Behandlung ist.*</span>
  </label>
  {error && <p class="err" role="alert">Bitte prüfe deine Eingaben — die Anmeldung war nicht möglich.</p>}
  <button class="btn" type="submit">Verbindlich anmelden</button>
</form>
<style>
  .reg { display: grid; gap: 1rem; max-width: 38rem; }
  .row { display: grid; gap: 1rem; grid-template-columns: 1fr; }
  @media (min-width: 32rem) { .row { grid-template-columns: 1fr 1fr; } }
  .field { display: grid; gap: .3rem; }
  input, textarea { padding: .6rem .7rem; border: 1px solid var(--border); border-radius: var(--radius); font: inherit; background: var(--surface); width: 100%; }
  .consent { display: flex; gap: .5rem; align-items: flex-start; font-size: .95rem; }
  .hp { position: absolute; left: -9999px; height: 0; overflow: hidden; }
  .err { color: var(--clay-dark); }
</style>
```

- [ ] **Step 2: Write `src/pages/api/event-registration.ts`**

```ts
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { validateEventRegistration } from '../../lib/validation/event-registration';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
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

  const db = (locals as any).runtime.env.DB as D1Database;
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
```

- [ ] **Step 3: Verify build compiles**

Run: `bun run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/EventRegistrationForm.astro src/pages/api/event-registration.ts
git commit -m "feat: event registration form and API route (status/deadline/capacity/consent)"
```

---

## Task 13: Static pages — Startseite, Über, FAQ, Danke, Legal

**Files:**
- Create: `src/components/EventCard.astro`, `src/components/TestimonialCard.astro`, `src/pages/index.astro`, `src/pages/ueber.astro`, `src/pages/faq.astro`, `src/pages/danke.astro`, `src/pages/newsletter.astro`, `src/pages/impressum.astro`, `src/pages/datenschutz.astro`

- [ ] **Step 1: Write `src/components/EventCard.astro`**

```astro
---
import { formatDateDe, formatTimeDe, isPast } from '../lib/datetime';
interface Props { event: any }
const { event } = Astro.props;
const past = isPast(event.data.date) || event.data.status !== 'open';
---
<article class="card reveal">
  <p class="meta">{formatDateDe(event.data.date)} · {formatTimeDe(event.data.date)} Uhr</p>
  <h3><a href={`/veranstaltungen/${event.id}`}>{event.data.title}</a></h3>
  <p>{event.data.excerpt}</p>
  <p class="loc">{event.data.locationName}</p>
  <p class="status">{past ? 'Anmeldung geschlossen' : 'Anmeldung möglich'}</p>
</article>
<style>
  .card { border: 1px solid var(--border); border-radius: var(--radius); padding: 1.4rem; background: var(--surface); transition: transform .2s ease, box-shadow .2s ease; }
  .card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(34,32,29,.06); }
  .meta { color: var(--olive); font-weight: 600; margin: 0 0 .3rem; font-size: .9rem; }
  h3 { margin: 0 0 .4rem; } h3 a { text-decoration: none; color: var(--ink); }
  .loc { color: var(--ink-soft); font-size: .9rem; } .status { font-size: .85rem; font-weight: 600; }
</style>
```

- [ ] **Step 2: Write `src/components/TestimonialCard.astro`**

```astro
---
interface Props { author: string; context?: string }
const { author, context } = Astro.props;
---
<figure class="t reveal">
  <blockquote><slot /></blockquote>
  <figcaption>— {author}{context ? `, ${context}` : ''}</figcaption>
</figure>
<style>
  .t { margin: 0; border-left: 3px solid var(--clay); padding: .5rem 0 .5rem 1.2rem; }
  blockquote { margin: 0; font-family: var(--serif); font-size: 1.15rem; }
  figcaption { margin-top: .6rem; color: var(--ink-soft); font-size: .9rem; }
</style>
```

- [ ] **Step 3: Write `src/pages/index.astro`**

```astro
---
import { getCollection, getEntry, render } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import EventCard from '../components/EventCard.astro';
import TestimonialCard from '../components/TestimonialCard.astro';
import NewsletterForm from '../components/NewsletterForm.astro';
import { isPast } from '../lib/datetime';

const settings = await getEntry('settings', 'site');
const events = (await getCollection('events')).sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
const upcoming = events.filter((e) => !isPast(e.data.date) && e.data.status === 'open').slice(0, 3);
const testimonials = (await getCollection('testimonials')).sort((a, b) => a.data.order - b.data.order);
const renderedTestimonials = await Promise.all(testimonials.map(async (t) => ({ data: t.data, Content: (await render(t)).Content })));
const archetypes = [
  { name: 'Der Krieger', text: 'Grenzen setzen, Entscheidungen treffen, handlungsfähig bleiben.' },
  { name: 'Der Liebhaber', text: 'Verbindung spüren, Gefühle ausdrücken, Nähe zulassen.' },
  { name: 'Der Zauberer', text: 'Muster erkennen, ehrlich reflektieren, Klarheit gewinnen.' },
  { name: 'Der König', text: 'Verantwortung übernehmen, Orientierung geben, mit Integrität handeln.' },
  { name: 'Der weise Vater', text: 'Geduldig zuhören, reif reagieren, mit Überblick führen.' },
];
---
<BaseLayout title={`${settings!.data.siteTitle} – ${settings!.data.tagline}`} description="Ein geschützter Männerkreis im Raum Straubing und Niederbayern: Atemarbeit, ehrliches Zuhören und echte Verbindung.">
  <section class="hero container">
    <p class="eyebrow reveal">{settings!.data.region}</p>
    <h1 class="reveal">{settings!.data.tagline}</h1>
    <p class="lead reveal">Ein geschützter Raum für Männer, die ehrlich mit sich arbeiten wollen — bodenständig, vertraulich, ohne Show.</p>
    <p class="reveal"><a class="btn" href="/veranstaltungen">Veranstaltungen ansehen</a> <a class="btn btn--ghost" href="/ueber">Mehr über den Kreis</a></p>
  </section>

  <section class="container">
    <h2>Nächste Veranstaltungen</h2>
    {upcoming.length === 0 ? <p>Aktuell sind keine Termine offen. Trag dich in den Newsletter ein.</p> : (
      <div class="cards">{upcoming.map((e) => <EventCard event={e} />)}</div>
    )}
  </section>

  <section class="container">
    <h2>Archetypen-Kompass</h2>
    <div class="cards">
      {archetypes.map((a) => (
        <article class="card reveal"><h3>{a.name}</h3><p>{a.text}</p></article>
      ))}
    </div>
  </section>

  <section class="container">
    <h2>Stimmen aus dem Kreis</h2>
    <div class="quotes">
      {renderedTestimonials.map((t) => (
        <TestimonialCard author={t.data.author} context={t.data.context}><t.Content /></TestimonialCard>
      ))}
    </div>
  </section>

  <section class="container nl-section reveal">
    <h2>Bleib informiert</h2>
    <p>Erfahre von neuen Terminen — cookie-frei und ohne Tracking.</p>
    <NewsletterForm />
  </section>
</BaseLayout>
<style>
  .hero { padding-block: clamp(2.5rem, 6vw, 5rem); }
  .eyebrow { color: var(--olive); font-weight: 600; letter-spacing: .04em; text-transform: uppercase; font-size: .85rem; }
  .lead { font-size: 1.2rem; max-width: var(--max); }
  section { margin-block: clamp(2rem, 5vw, 3.5rem); }
  .cards { display: grid; gap: 1.2rem; grid-template-columns: 1fr; }
  @media (min-width: 48rem) { .cards { grid-template-columns: repeat(3, 1fr); } }
  .card { border: 1px solid var(--border); border-radius: var(--radius); padding: 1.4rem; background: var(--surface); }
  .card h3 { margin-top: 0; }
  .quotes { display: grid; gap: 1.6rem; grid-template-columns: 1fr; }
  @media (min-width: 48rem) { .quotes { grid-template-columns: repeat(3, 1fr); } }
  .nl-section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem; }
</style>
```

- [ ] **Step 4: Write `src/pages/ueber.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
const phases = [
  { t: 'Rahmen setzen & Zustimmung klären', d: 'Wir beginnen mit einem klaren Rahmen: Vertraulichkeit, Ehrlichkeit, Akzeptanz, Eigenverantwortung und Zustimmung.' },
  { t: 'Ankommen, Atem & Check-in', d: 'Über Atem, Körperwahrnehmung und einen ehrlichen Check-in kommt jeder im Raum an.' },
  { t: 'Aktives Zuhören & Spiegelung', d: 'Wir üben, wirklich zuzuhören: ohne vorschnelle Ratschläge, ohne Bewertung.' },
  { t: 'Körperarbeit, Klärung & Integration', d: 'Je nach Abend arbeiten wir mit Atemarbeit, somatischer Bewegung, Grenzen oder inneren Anteilen.' },
];
---
<BaseLayout title="Über den Männerkreis" description="Bodenständige Männerarbeit im Raum Straubing: weniger Konzepte, mehr echte Erfahrung in Körper, Atem und Beziehung.">
  <section class="container prose">
    <h1>Über den Kreis</h1>
    <p>Ich bin Markus Sommer und leite den Männerkreis im Raum Straubing für Männer aus Niederbayern. Mein Fokus ist eine klare, bodenständige Männerarbeit: weniger Konzepte, mehr echte Erfahrung im Körper, im Atem und in Beziehung. Nicht perfekt wirken, sondern wahrhaftiger werden.</p>
    <p>Stärke heißt für mich: klar führen, offen zuhören und verantwortlich handeln.</p>
    <h2>Der Ablauf eines Abends</h2>
    <ol class="phases">
      {phases.map((p) => <li><strong>{p.t}</strong><br />{p.d}</li>)}
    </ol>
  </section>
</BaseLayout>
<style>
  .phases { display: grid; gap: 1rem; padding-left: 1.2rem; }
  .phases li { line-height: 1.5; }
</style>
```

- [ ] **Step 5: Write `src/pages/faq.astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
const faqs = (await getCollection('faq')).sort((a, b) => a.data.order - b.data.order);
const rendered = await Promise.all(faqs.map(async (f) => ({ data: f.data, Content: (await render(f)).Content })));
---
<BaseLayout title="Häufige Fragen" description="Antworten zu Ablauf, Kosten, Vertraulichkeit und der Abgrenzung zu Therapie im Männerkreis.">
  <section class="container prose">
    <h1>Häufige Fragen</h1>
    {rendered.map((f) => (
      <details>
        <summary>{f.data.question}</summary>
        <div class="answer"><f.Content /></div>
      </details>
    ))}
  </section>
</BaseLayout>
<style>
  details { border-bottom: 1px solid var(--border); padding: 1rem 0; }
  summary { cursor: pointer; font-family: var(--serif); font-size: 1.15rem; font-weight: 600; }
  .answer { margin-top: .6rem; color: var(--ink-soft); }
</style>
```

- [ ] **Step 6: Write `src/pages/newsletter.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import NewsletterForm from '../components/NewsletterForm.astro';
---
<BaseLayout title="Newsletter" description="Erfahre von neuen Männerkreis-Terminen — cookie-frei, ohne Tracking, jederzeit abbestellbar.">
  <section class="container prose">
    <h1>Newsletter</h1>
    <p>Trag dich ein und erfahre von neuen Terminen. Wir speichern nur, was nötig ist, und geben nichts weiter.</p>
    <NewsletterForm />
  </section>
</BaseLayout>
```

- [ ] **Step 7: Write `src/pages/danke.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
const type = Astro.url.searchParams.get('type');
const msg = type === 'event'
  ? 'Danke für deine Anmeldung. Du erhältst die Details und die genaue Adresse per E-Mail.'
  : 'Danke für deine Eintragung. Wir melden uns mit kommenden Terminen.';
---
<BaseLayout title="Danke" description="Vielen Dank.">
  <section class="container prose">
    <h1>Danke</h1>
    <p>{msg}</p>
    <p><a class="btn" href="/">Zur Startseite</a></p>
  </section>
</BaseLayout>
```

- [ ] **Step 8: Write `src/pages/impressum.astro` and `src/pages/datenschutz.astro`** (placeholders)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getEntry } from 'astro:content';
const s = await getEntry('settings', 'site');
---
<BaseLayout title="Impressum" description="Impressum des Männerkreises.">
  <section class="container prose">
    <h1>Impressum</h1>
    <p><strong>Platzhalter – bitte vom Betreiber ausfüllen.</strong></p>
    <p>{s!.data.operatorName}<br />{s!.data.operatorAddress}</p>
    <p>Kontakt: {s!.data.contactEmail}</p>
    <p>Angaben gemäß § 5 TMG folgen.</p>
  </section>
</BaseLayout>
```

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Datenschutz" description="Datenschutzerklärung – cookie-freier, tracking-freier Betrieb.">
  <section class="container prose">
    <h1>Datenschutz</h1>
    <p><strong>Platzhalter – bitte vom Betreiber rechtlich prüfen lassen.</strong></p>
    <h2>Cookie-freier Betrieb</h2>
    <p>Diese Website setzt keine Cookies, kein Tracking, keine Analytics, keine externen Schriftarten und keine Drittanbieter-Skripte ein. Es gibt keine Einbettungen von Karten, Videos oder sozialen Netzwerken.</p>
    <h2>Formulardaten</h2>
    <p>Bei der Event-Anmeldung speichern wir Vorname, Nachname, E-Mail und optional Telefon und Nachricht, um die Teilnahme zu organisieren. Beim Newsletter speichern wir die E-Mail und optional den Vornamen. Wir speichern keine IP-Adressen und keine Geräte- oder Tracking-Kennungen.</p>
    <p>Du kannst jederzeit Auskunft, Berichtigung oder Löschung verlangen.</p>
  </section>
</BaseLayout>
```

- [ ] **Step 9: Verify build**

Run: `bun run build`
Expected: build succeeds; pages generated.

- [ ] **Step 10: Commit**

```bash
git add src/components/EventCard.astro src/components/TestimonialCard.astro src/pages/index.astro src/pages/ueber.astro src/pages/faq.astro src/pages/newsletter.astro src/pages/danke.astro src/pages/impressum.astro src/pages/datenschutz.astro
git commit -m "feat: home, ueber, faq, newsletter, danke, legal pages"
```

---

## Task 14: Events list, event detail, blog list, blog detail, ICS route

**Files:**
- Create: `src/pages/veranstaltungen/index.astro`, `src/pages/veranstaltungen/[slug].astro`, `src/pages/veranstaltungen/[slug].ics.ts`, `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro`

- [ ] **Step 1: Write `src/pages/veranstaltungen/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import EventCard from '../../components/EventCard.astro';
import { isPast } from '../../lib/datetime';
const all = (await getCollection('events')).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
const upcoming = all.filter((e) => !isPast(e.data.date) && e.data.status === 'open').sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
const past = all.filter((e) => isPast(e.data.date) || e.data.status !== 'open');
---
<BaseLayout title="Veranstaltungen" description="Kommende und vergangene Männerkreis-Abende im Raum Straubing und Geiselhöring.">
  <section class="container">
    <h1>Veranstaltungen</h1>
    <h2>Kommende Termine</h2>
    {upcoming.length === 0 ? <p>Aktuell keine offenen Termine. Trag dich in den <a href="/newsletter">Newsletter</a> ein.</p> : (
      <div class="cards">{upcoming.map((e) => <EventCard event={e} />)}</div>
    )}
    {past.length > 0 && (
      <>
        <h2>Vergangene Termine</h2>
        <div class="cards dim">{past.map((e) => <EventCard event={e} />)}</div>
      </>
    )}
  </section>
</BaseLayout>
<style>
  .cards { display: grid; gap: 1.2rem; grid-template-columns: 1fr; margin-bottom: 2rem; }
  @media (min-width: 48rem) { .cards { grid-template-columns: repeat(2, 1fr); } }
  .dim { opacity: .7; }
</style>
```

- [ ] **Step 2: Write `src/pages/veranstaltungen/[slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import EventRegistrationForm from '../../components/EventRegistrationForm.astro';
import { formatDateDe, formatTimeDe, isPast } from '../../lib/datetime';

export const prerender = true;
export async function getStaticPaths() {
  const events = await getCollection('events');
  return events.map((e) => ({ params: { slug: e.id }, props: { event: e } }));
}
const { event } = Astro.props;
const { Content } = await render(event);
const closed = isPast(event.data.date) || event.data.status !== 'open' || new Date() > event.data.registrationDeadline;
const jsonLd = {
  '@context': 'https://schema.org', '@type': 'Event', name: event.data.title,
  startDate: event.data.date.toISOString(), eventStatus: 'https://schema.org/EventScheduled',
  location: { '@type': 'Place', name: event.data.locationName },
  description: event.data.excerpt,
};
---
<BaseLayout title={`${event.data.title} – Veranstaltung`} description={event.data.excerpt}>
  <Fragment slot="head">
    <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
  </Fragment>
  <article class="container prose">
    <p class="meta">{formatDateDe(event.data.date)} · {formatTimeDe(event.data.date)}–{event.data.endTime} Uhr</p>
    <h1>{event.data.title}</h1>
    {event.data.theme && <p class="theme">Thema: {event.data.theme}</p>}
    <dl class="facts">
      <div><dt>Ort</dt><dd>{event.data.locationName}</dd></div>
      <div><dt>Plätze</dt><dd>max. {event.data.capacity}</dd></div>
      <div><dt>Beitrag</dt><dd>{event.data.donationHint}</dd></div>
    </dl>
    <p class="note">{event.data.addressNote}</p>
    <p><a class="btn btn--ghost" href={`/veranstaltungen/${event.id}.ics`}>Zum Kalender hinzufügen</a></p>
    <Content />
    {event.data.agenda.length > 0 && (
      <>
        <h2>Ablauf</h2>
        <ul>{event.data.agenda.map((a) => <li>{a}</li>)}</ul>
      </>
    )}
    <h2 id="anmeldung">Anmeldung</h2>
    {closed
      ? <p class="closed">Für diesen Termin ist keine Anmeldung (mehr) möglich. Trag dich gern in den <a href="/newsletter">Newsletter</a> ein.</p>
      : <EventRegistrationForm slug={event.id} />}
  </article>
</BaseLayout>
<style>
  .meta { color: var(--olive); font-weight: 600; }
  .theme { color: var(--ink-soft); }
  .facts { display: grid; gap: .6rem; grid-template-columns: 1fr; border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem 1.2rem; background: var(--surface); }
  @media (min-width: 32rem) { .facts { grid-template-columns: repeat(3, 1fr); } }
  .facts dt { font-weight: 600; font-size: .85rem; color: var(--ink-soft); }
  .facts dd { margin: 0; }
  .note { font-style: italic; color: var(--ink-soft); }
  .closed { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem; }
</style>
```

- [ ] **Step 3: Write `src/pages/veranstaltungen/[slug].ics.ts`**

```ts
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildIcs } from '../../lib/ics';

export const prerender = true;
export async function getStaticPaths() {
  const events = await getCollection('events');
  return events.map((e) => ({ params: { slug: e.id }, props: { event: e } }));
}
export const GET: APIRoute = ({ props }) => {
  const e = (props as any).event;
  const [h, m] = String(e.data.endTime).split(':').map(Number);
  const end = new Date(e.data.date);
  end.setHours(h, m, 0, 0);
  const ics = buildIcs({
    uid: `${e.id}@maennerkreis`, title: e.data.title, description: e.data.excerpt,
    location: e.data.locationName, start: e.data.date, end,
  });
  return new Response(ics, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
```

- [ ] **Step 4: Write `src/pages/blog/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { formatDateDe } from '../../lib/datetime';
const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---
<BaseLayout title="Impulse" description="Kurze Impulse und Reflexionen aus dem Männerkreis.">
  <section class="container prose">
    <h1>Impulse</h1>
    <ul class="posts">
      {posts.map((p) => (
        <li class="reveal">
          <p class="meta">{formatDateDe(p.data.date)}</p>
          <h2><a href={`/blog/${p.id}`}>{p.data.title}</a></h2>
          <p>{p.data.excerpt}</p>
        </li>
      ))}
    </ul>
  </section>
</BaseLayout>
<style>
  .posts { list-style: none; padding: 0; display: grid; gap: 2rem; }
  .meta { color: var(--olive); font-weight: 600; font-size: .9rem; margin: 0; }
  .posts h2 { margin: .2rem 0; } .posts h2 a { text-decoration: none; color: var(--ink); }
</style>
```

- [ ] **Step 5: Write `src/pages/blog/[slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { formatDateDe } from '../../lib/datetime';
export const prerender = true;
export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((p) => ({ params: { slug: p.id }, props: { post: p } }));
}
const { post } = Astro.props;
const { Content } = await render(post);
---
<BaseLayout title={post.data.title} description={post.data.excerpt} type="article">
  <article class="container prose">
    <p class="meta">{formatDateDe(post.data.date)} · {post.data.author}</p>
    <h1>{post.data.title}</h1>
    <Content />
    <p><a href="/blog">← Alle Impulse</a></p>
  </article>
</BaseLayout>
<style>.meta { color: var(--olive); font-weight: 600; }</style>
```

- [ ] **Step 6: Verify build**

Run: `bun run build`
Expected: build succeeds; event/blog detail pages + `.ics` generated under `dist/`.

- [ ] **Step 7: Commit**

```bash
git add src/pages/veranstaltungen src/pages/blog
git commit -m "feat: events list/detail + ics, blog list/detail"
```

---

## Task 15: robots.txt, favicon, OG image, Sveltia CMS

**Files:**
- Create: `public/robots.txt`, `public/favicon.svg`, `public/og-default.svg`, `public/admin/index.html`, `public/admin/config.yml`

- [ ] **Step 1: Write `public/robots.txt`**

```
User-agent: *
Allow: /
Disallow: /admin
Sitemap: https://maennerkreis.example/sitemap-index.xml
```

- [ ] **Step 2: Write `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#a8553b"/><circle cx="16" cy="16" r="7" fill="none" stroke="#f7f3ec" stroke-width="2.5"/></svg>
```

- [ ] **Step 3: Write `public/og-default.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f7f3ec"/><text x="80" y="320" font-family="Georgia, serif" font-size="64" fill="#22201d">Männerkreis</text><text x="80" y="400" font-family="system-ui, sans-serif" font-size="34" fill="#5a6650">Weniger Fassade. Mehr Wahrheit. Mehr Verbindung.</text></svg>
```

- [ ] **Step 4: Write `public/admin/index.html`**

```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Inhalte verwalten · Männerkreis</title>
  </head>
  <body>
    <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js" type="module"></script>
  </body>
</html>
```

Note: this script is loaded only in `/admin` (editor area), never on visitor-facing pages, so the public site stays free of third-party scripts.

- [ ] **Step 5: Write `public/admin/config.yml`**

```yaml
backend:
  name: github
  repo: OWNER/REPO   # TODO: set to your GitHub repo
  branch: main
local_backend: true
media_folder: "public/uploads"
public_folder: "/uploads"
collections:
  - name: events
    label: Veranstaltungen
    folder: "src/content/events"
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    extension: md
    fields:
      - { name: title, label: Titel, widget: string }
      - { name: date, label: Datum/Beginn, widget: datetime }
      - { name: endTime, label: Ende (HH:MM), widget: string }
      - { name: locationName, label: Ort, widget: string }
      - { name: addressNote, label: Adress-Hinweis, widget: string, required: false }
      - { name: capacity, label: Kapazität, widget: number, value_type: int }
      - { name: donationHint, label: Beitrag, widget: string, required: false }
      - { name: theme, label: Thema, widget: string, required: false }
      - { name: status, label: Status, widget: select, options: ["open", "closed", "cancelled"], default: "open" }
      - { name: registrationDeadline, label: Anmeldeschluss, widget: datetime }
      - { name: excerpt, label: Kurztext, widget: text }
      - { name: agenda, label: Ablauf, widget: list, field: { name: item, label: Punkt, widget: string } }
      - { name: body, label: Beschreibung, widget: markdown }
  - name: blog
    label: Impulse
    folder: "src/content/blog"
    create: true
    extension: md
    fields:
      - { name: title, label: Titel, widget: string }
      - { name: date, label: Datum, widget: datetime }
      - { name: excerpt, label: Kurztext, widget: text }
      - { name: author, label: Autor, widget: string, default: "Markus Sommer" }
      - { name: tags, label: Tags, widget: list, required: false }
      - { name: draft, label: Entwurf, widget: boolean, default: false }
      - { name: body, label: Text, widget: markdown }
  - name: faq
    label: FAQ
    folder: "src/content/faq"
    create: true
    extension: md
    fields:
      - { name: question, label: Frage, widget: string }
      - { name: order, label: Reihenfolge, widget: number, value_type: int, default: 0 }
      - { name: body, label: Antwort, widget: markdown }
  - name: testimonials
    label: Testimonials
    folder: "src/content/testimonials"
    create: true
    extension: md
    fields:
      - { name: author, label: Name, widget: string }
      - { name: context, label: Kontext, widget: string, required: false }
      - { name: order, label: Reihenfolge, widget: number, value_type: int, default: 0 }
      - { name: body, label: Zitat, widget: markdown }
  - name: settings
    label: Einstellungen
    files:
      - name: site
        label: Website-Einstellungen
        file: "src/content/settings/site.json"
        fields:
          - { name: id, label: ID, widget: hidden, default: "site" }
          - { name: siteTitle, label: Titel, widget: string }
          - { name: tagline, label: Claim, widget: string }
          - { name: region, label: Region, widget: string }
          - { name: contactEmail, label: Kontakt-E-Mail, widget: string }
          - { name: whatsappUrl, label: WhatsApp-Link, widget: string, required: false }
          - { name: operatorName, label: Betreiber-Name, widget: string }
          - { name: operatorAddress, label: Betreiber-Adresse, widget: string }
```

- [ ] **Step 6: Verify build still succeeds and admin assets are copied**

Run: `bun run build`
Expected: succeeds; `dist/admin/index.html` and `dist/admin/config.yml` exist; `dist/robots.txt` exists.

- [ ] **Step 7: Commit**

```bash
git add public
git commit -m "feat: robots, favicon, OG image, Sveltia CMS at /admin"
```

---

## Task 16: German README + docs

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`** covering all required sections

````md
# Männerkreis – Website

Ruhige, schnelle, cookie-freie Website für den Männerkreis im Raum Straubing.
Astro + TypeScript, Bun, Cloudflare Pages, Cloudflare D1, Sveltia CMS.

## Schnellstart (Bun)

```bash
bun install
bun run dev      # Entwicklung auf http://localhost:4321
bun run build    # Produktions-Build nach dist/
bun run preview  # Build lokal ansehen
bun test         # Validierungs-Tests
```

## Inhalte pflegen (Sveltia CMS)

Das CMS liegt unter `/admin`. Inhalte werden als Markdown/JSON im Repo
gespeichert (Git-Backend). Lokal:

```bash
# In einem zweiten Terminal:
bunx @sveltia/cms-proxy-server
# dann /admin öffnen; local_backend ist aktiv
```

Für die Produktion in `public/admin/config.yml` `repo: OWNER/REPO` setzen und
GitHub-OAuth beim Auth-Provider hinterlegen.

## Cloudflare D1 einrichten

```bash
# Datenbank anlegen
bunx wrangler d1 create maennerkreis-db
# Die ausgegebene database_id in wrangler.toml eintragen.

# Migration lokal anwenden
bunx wrangler d1 migrations apply maennerkreis-db --local
# Migration remote anwenden
bunx wrangler d1 migrations apply maennerkreis-db --remote
```

Binding-Name ist `DB`. Tabellen: `event_registrations`, `newsletter_subscribers`
(siehe `schema.sql` / `migrations/`).

## Deployment (Cloudflare Pages)

1. Repo mit Cloudflare Pages verbinden.
2. Build-Befehl `bun run build`, Output `dist`.
3. D1-Datenbank als Binding `DB` im Pages-Projekt hinterlegen.
4. Migrationen remote anwenden (siehe oben).

## Anmeldungen

- **Event-Anmeldung** (`/veranstaltungen/<slug>`): serverseitig validiert
  (Pflichtfelder, gültige E-Mail, beide Zustimmungen, Honeypot). Geprüft werden
  Event-Status, Anmeldefrist und Kapazität. Speicherung in
  `event_registrations`.
- **Newsletter** (`/newsletter`, Footer): E-Mail, optional Vorname,
  Datenschutz-Zustimmung, Honeypot. Doppelte E-Mails werden ignoriert
  (UNIQUE). Double-Opt-In ist strukturell vorbereitet (`status`,
  `confirm_token`) – ein externer Mailversand ist bewusst **nicht** angebunden
  (TODO im Code).

## Cookie-freier Betrieb / DSGVO-arme Konfiguration

Diese Website ist bewusst datensparsam:

- keine Cookies, kein `localStorage`/`sessionStorage` für Tracking
- kein Analytics, kein Google Tag Manager, keine Marketing-Pixel
- keine externen Schriftarten (nur Systemfonts)
- keine Google Maps / YouTube / Social-Media-Einbettungen
- keine externen Captchas, kein Cloudflare Turnstile (nur Honeypot)
- keine Drittanbieter-Skripte auf den Besucherseiten (Sveltia CMS lädt nur unter
  `/admin`)
- es werden **keine** IP-Adressen, User-Agents oder Tracking-IDs gespeichert
- Newsletter und Event-Anmeldung sind getrennt (eigene Tabellen, eigene
  Zustimmung)
- keine vorausgewählten Checkboxen

Deshalb ist **kein Cookie-Banner** erforderlich.

## Rechtliches

`/impressum` und `/datenschutz` sind Platzhalter und müssen vom Betreiber
rechtlich geprüft und ausgefüllt werden.
````

- [ ] **Step 2: Commit**

```bash
git add README.md && git commit -m "docs: German README with Bun, D1, CMS, DSGVO sections"
```

---

## Task 17: Final verification + code review

- [ ] **Step 1: Run full test suite**

Run: `bun test`
Expected: all tests PASS. Report actual output.

- [ ] **Step 2: Production build**

Run: `bun run build`
Expected: success, no errors. Confirm `dist/` has pages, `.ics`, `admin/`, `robots.txt`, sitemap.

- [ ] **Step 3: Local runtime smoke test with D1**

Run: `bunx wrangler d1 migrations apply maennerkreis-db --local` then `bun run preview` (or `bunx wrangler pages dev dist`).
Manually verify: home renders, event detail shows form, submitting newsletter/event redirects to `/danke`, past event hides form. Report findings.

- [ ] **Step 4: Privacy audit**

Grep the built `dist/` for forbidden third-party references (excluding `/admin`):
Run: `grep -rilE "googleapis|gtag|google-analytics|googletagmanager|youtube|fonts.gstatic|turnstile|facebook" dist --exclude-dir=admin || echo "clean"`
Expected: `clean`.

- [ ] **Step 5: Invoke requesting-code-review skill**

Use superpowers:requesting-code-review against the full diff before declaring done.

- [ ] **Step 6: Final commit if review changes made**

```bash
git add -A && git commit -m "chore: final QA and review fixes"
```

---

## Notes for the implementer

- Astro v5 Content Layer: collection entry id = filename without extension; `e.id` is the slug used in routes and in `event_slug`. Keep these consistent.
- D1 access in endpoints is via `locals.runtime.env.DB` (Cloudflare adapter with `platformProxy` enabled for local dev).
- Keep all client JS out of visitor pages except the BaseLayout scroll-reveal script and native `<details>`.
- Every checkbox is opt-in (no `checked` attribute) — never pre-select consent.
