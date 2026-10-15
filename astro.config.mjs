// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';

// SITE_MODE controls prototype vs. public behaviour (see docs/IMPLEMENTATION_PLAN.md).
//   prototype (default): placeholder content is shown with visible labels, pages are noindex.
//   launch: placeholder content is withheld, pages are indexable.
const siteUrl = process.env.SITE_URL ?? 'http://localhost:4321';

// The editor is always available in development. In production it is only mounted when
// GitHub storage has been configured (see keystatic.config.ts), so a deployed site never
// exposes an unauthenticated editor.
const editorEnabled =
  process.env.NODE_ENV !== 'production' || Boolean(process.env.KEYSTATIC_GITHUB_REPO);

export default defineConfig({
  site: siteUrl,
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    sitemap({ filter: (page) => !/\/(keystatic|api|contact\/send)/.test(page) }),
    ...(editorEnabled ? [react(), keystatic()] : []),
  ],
  security: { checkOrigin: true },
});
