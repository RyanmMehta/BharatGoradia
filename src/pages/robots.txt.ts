import type { APIRoute } from 'astro';
import { isPrototype } from '../lib/site';

// Prototype and staging builds are excluded from search engines entirely (PRD §17).
export const GET: APIRoute = ({ site }) => {
  const body = isPrototype
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /keystatic\nDisallow: /api/\nDisallow: /contact/send\n\nSitemap: ${new URL('/sitemap-index.xml', site)}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
