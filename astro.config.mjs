// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';

// SITE_MODE controls prototype vs. public behaviour (see docs/IMPLEMENTATION_PLAN.md).
//   prototype (default): placeholder content is shown with visible labels, pages are noindex.
//   launch: placeholder content is withheld, pages are indexable.
const env = process.env;

// Where the site is being built. Cloudflare's Git builds set WORKERS_CI=1; Vercel sets VERCEL=1.
// DEPLOY_TARGET=cloudflare builds the Cloudflare version locally (e.g. to try it with `npx wrangler dev`).
const onCloudflare = Boolean(env.WORKERS_CI) || env.DEPLOY_TARGET === 'cloudflare';
const onVercel = !onCloudflare && Boolean(env.VERCEL);

const siteUrl =
  env.SITE_URL ||
  (onCloudflare && 'https://bharatgoradia.org') ||
  (env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  (env.RAILWAY_PUBLIC_DOMAIN && `https://${env.RAILWAY_PUBLIC_DOMAIN}`) ||
  'http://localhost:4321';

// The editor is always available in development. In production it is only mounted when
// GitHub storage has been configured (see keystatic.config.ts), so a deployed site never
// exposes an unauthenticated editor.
const editorEnabled = process.argv.includes('dev') || Boolean(env.KEYSTATIC_GITHUB_REPO);

export default defineConfig({
  site: siteUrl,
  output: 'static',
  // Everywhere other than Cloudflare and Vercel, the site runs as a standalone Node server.
  // On Cloudflare, images are optimised at build time (every page is prerendered).
  adapter: onCloudflare ? cloudflare({ imageService: 'compile' }) : onVercel ? vercel() : node({ mode: 'standalone' }),
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    sitemap({ filter: (page) => !/\/(keystatic|api|contact\/send)/.test(page) }),
    ...(editorEnabled ? [react(), keystatic()] : []),
  ],
  security: { checkOrigin: true },
});
