import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://new.mens-circle.de',
  output: 'static',
  adapter: cloudflare({ platformProxy: { enabled: true } }),
  integrations: [mdx(), sitemap({ filter: (p) => !p.includes('/admin') })],
});
