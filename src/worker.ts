// Cloudflare Workers entry point. Astro serves the site; a cron trigger (wrangler.jsonc) retries
// enquiry notifications and purges old enquiries, the job `npm run enquiries:retry` does on a Node server.
import { env } from 'cloudflare:workers';
import { handle } from '@astrojs/cloudflare/handler';
import { enquiryDeps } from './lib/enquiry/runtime.ts';
import { runMaintenance } from './lib/enquiry/service.ts';

// Hand the D1 database to the enquiry service before any request is handled.
(globalThis as { __enquiryD1?: unknown }).__enquiryD1 = env.DB;

export default {
  fetch: handle,
  async scheduled(_controller: unknown, _env: unknown, ctx: { waitUntil(task: Promise<unknown>): void }) {
    ctx.waitUntil(
      runMaintenance(enquiryDeps()).then((r) =>
        console.log(`[enquiry] retried ${r.retried}, purged ${r.purged}, permanently failed ${r.failed}`),
      ),
    );
  },
};
