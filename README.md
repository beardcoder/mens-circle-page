# Männerkreis – Website

Ruhige, schnelle, cookie-freie Website für den Männerkreis im Raum Straubing.
**Astro + TypeScript**, **Bun**, **Cloudflare Pages**, **Cloudflare D1**, **Sveltia CMS**.

- Mobil-first, sehr gut lesbar, warm und bodenständig
- Möglichst wenig JavaScript, keine schwere UI-Library
- Systemfonts (keine externen Schriftarten), CSS-first Animationen mit
  `prefers-reduced-motion`
- Komplett ohne Cookies, Tracking, Analytics oder Drittanbieter-Skripte

## Tech-Überblick

| Bereich | Lösung |
|---|---|
| Framework | Astro 6 (`output: 'static'`, Cloudflare-Adapter) |
| Sprache | TypeScript |
| Paketmanager | Bun |
| Inhalte | Markdown/MDX Content Collections (`src/content`) |
| Formulare | Astro API Routes (`src/pages/api`) |
| Datenbank | Cloudflare D1 (Binding `DB`) |
| CMS | Sveltia CMS unter `/admin` |
| Hosting | Cloudflare Pages |

## Schnellstart (Bun)

```bash
bun install
bun run dev      # Entwicklung auf http://localhost:4321
bun run build    # Produktions-Build nach dist/
bun run preview  # Build lokal ansehen
bun test         # Validierungs-Tests (bun:test)
```

## Projektstruktur

```
src/
  content/        Inhalte: events, blog, faq, testimonials, settings/site.json
  content.config.ts   Schemas der Content Collections
  lib/            Validierung (event-registration, newsletter, email), datetime, ics, token, settings
  layouts/        BaseLayout
  components/     Header, Footer, Formulare, Cards, SEO (BaseHead)
  pages/          Seiten + API-Routen (api/newsletter.ts, api/event-registration.ts)
  styles/global.css   Farben, Typografie, Bewegung
public/
  admin/          Sveltia CMS (index.html + config.yml)
  robots.txt, favicon.svg, og-default.svg
migrations/0001_init.sql   D1-Migration
schema.sql        Vollständiges Schema (Komfort)
wrangler.toml     Cloudflare-Konfiguration inkl. D1-Binding DB
```

## Inhalte pflegen (Sveltia CMS)

Das CMS liegt unter `/admin`. Inhalte werden als Markdown/JSON im Repo
gespeichert (Git-Backend). Pflegbar sind: **Veranstaltungen, Impulse (Blog),
FAQ, Testimonials und Website-Einstellungen**.

**Lokal testen** (mit lokalem Proxy, ohne GitHub):

```bash
# In einem zweiten Terminal den Sveltia-Proxy starten:
bunx @sveltia/cms-proxy-server
# Danach „bun run dev" laufen lassen und /admin öffnen.
# local_backend: true ist in public/admin/config.yml aktiv.
```

**Für die Produktion:** in `public/admin/config.yml` `repo: OWNER/REPO` auf das
eigene GitHub-Repo setzen und GitHub-OAuth beim Auth-Provider hinterlegen
(z. B. eine kleine OAuth-Function). Die Zugangsdaten gehören in `.env`
(siehe `.env.example`), nicht ins Repo.

## Cloudflare D1 einrichten

Binding-Name ist `DB`. Tabellen: `event_registrations`,
`newsletter_subscribers` (siehe `schema.sql` / `migrations/`).

```bash
# 1) Datenbank anlegen
bunx wrangler d1 create maennerkreis-db
#    Die ausgegebene database_id in wrangler.toml eintragen.

# 2) Migration lokal anwenden (für bun run dev / preview)
bunx wrangler d1 migrations apply maennerkreis-db --local

# 3) Migration remote anwenden (Produktion)
bunx wrangler d1 migrations apply maennerkreis-db --remote
```

Lokale Daten ansehen:

```bash
bunx wrangler d1 execute maennerkreis-db --local \
  --command "SELECT * FROM newsletter_subscribers;"
```

## Deployment (Cloudflare Pages)

1. Repo mit Cloudflare Pages verbinden.
2. Build-Befehl `bun run build`, Output-Verzeichnis `dist`.
3. Im Pages-Projekt die D1-Datenbank als Binding `DB` hinterlegen.
4. Migrationen remote anwenden (siehe oben).

> Hinweis: Der Cloudflare-Adapter erzeugt eine Worker-kompatible Ausgabe.
> Deshalb enthält `wrangler.toml` bewusst **kein** `pages_build_output_dir`
> (das kollidiert mit der reservierten `ASSETS`-Bindung). Output-Verzeichnis
> wird im Pages-Projekt gesetzt.

## Anmeldungen

### Event-Anmeldung (`/veranstaltungen/<slug>`)
Serverseitig validiert in `src/pages/api/event-registration.ts`:
- Pflichtfelder: Vorname, Nachname, E-Mail (gültiges Format)
- Optional: Telefon, Nachricht
- Zwei Zustimmungen nötig: Datenschutz **und** Hinweis, dass der Männerkreis
  **kein Ersatz für Therapie oder medizinische Behandlung** ist
- Honeypot-Feld gegen Spam
- Geprüft werden zusätzlich **Event-Status**, **Anmeldefrist** und **Kapazität**
  (Anzahl vorhandener Anmeldungen < Kapazität)
- Speicherung in `event_registrations`. Bei Erfolg Weiterleitung auf `/danke`.

Die Validierungslogik ist als reine Funktion in
`src/lib/validation/event-registration.ts` getestet (`bun test`).

### Newsletter (`/newsletter`, Footer)
Serverseitig validiert in `src/pages/api/newsletter.ts`:
- E-Mail (Pflicht), Vorname (optional), Datenschutz-Zustimmung, Honeypot
- Doppelte E-Mails werden ignoriert (`UNIQUE(email)`, `ON CONFLICT DO NOTHING`)
- **Double-Opt-In ist strukturell vorbereitet** (`status = 'pending'`,
  `confirm_token`), ein externer Mailversand ist bewusst **nicht** angebunden
  (markierter TODO im Code).

Newsletter und Event-Anmeldung sind vollständig getrennt (eigene Tabellen,
eigene Formulare, eigene Zustimmung).

## Cookie-freier Betrieb / DSGVO-arme Konfiguration

Diese Website ist bewusst datensparsam aufgebaut:

- **keine Cookies**, kein `localStorage`/`sessionStorage` für Tracking
- **kein Analytics**, kein Google Tag Manager, keine Marketing-Pixel
- **keine externen Schriftarten** (ausschließlich Systemfonts)
- **keine Einbettungen** von Google Maps, YouTube oder sozialen Netzwerken
- **keine externen Captchas**, kein Cloudflare Turnstile (nur Honeypot)
- **keine Drittanbieter-Skripte** auf den Besucherseiten – Sveltia CMS lädt
  ausschließlich unter `/admin` (per `robots.txt` und `noindex` ausgenommen)
- es werden **keine IP-Adressen, User-Agents oder Tracking-IDs** gespeichert
- **keine vorausgewählten Checkboxen** – jede Zustimmung ist Opt-in

Deshalb ist **kein Cookie-Banner** erforderlich.

> Hinweis zu Sessions: Der Cloudflare-Adapter meldet beim Build „Enabling
> sessions". Astro setzt jedoch nur dann ein Session-Cookie, wenn `Astro.session`
> aktiv verwendet wird – das passiert in diesem Projekt **nirgends**. Es werden
> also keine Cookies an Besucher ausgeliefert.

## Rechtliches

`/impressum` und `/datenschutz` sind **Platzhalter** und müssen vom Betreiber
rechtlich geprüft und vollständig ausgefüllt werden.
