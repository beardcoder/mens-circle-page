/// <reference path="../.astro/types.d.ts" />

// Cloudflare bindings, typed for `import { env } from "cloudflare:workers"`.
interface Env {
  DB: D1Database;
}
