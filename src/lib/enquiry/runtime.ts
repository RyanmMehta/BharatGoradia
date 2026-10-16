// Wires the enquiry service to environment configuration for the running server.
import { createNotifier, type NotifyConfig } from './notify.ts';
import { RateLimiter } from './rate-limit.ts';
import { runMaintenance, type EnquiryDeps } from './service.ts';
import { SqliteEnquiryStore } from './store.ts';

const list = (v?: string) => (v ?? '').split(',').map((s) => s.trim()).filter(Boolean);
// process.env at runtime; import.meta.env covers values Vite inlined from .env files during development.
const env = (k: string) => process.env[k] ?? (import.meta.env?.[k] as string | undefined);

export function notifyConfigFromEnv(): NotifyConfig {
  return {
    provider: env('NOTIFY_PROVIDER') === 'resend' ? 'resend' : 'log',
    from: env('NOTIFY_FROM') ?? 'Website enquiries <enquiries@example.com>',
    to: list(env('NOTIFY_TO')),
    backupTo: list(env('NOTIFY_BACKUP_TO')),
    resendApiKey: env('RESEND_API_KEY'),
    siteName: 'Bharat Goradia',
  };
}

// Vercel functions can only write to /tmp, which is temporary. Fine for the prototype preview;
// connect a hosted database before real enquiries are expected (see docs/DEPLOY.md).
const defaultDbPath = () => (env('VERCEL') ? '/tmp/enquiries.db' : './data/enquiries.db');

export function createDepsFromEnv(): EnquiryDeps {
  return {
    store: new SqliteEnquiryStore(env('ENQUIRY_DB_PATH') ?? defaultDbPath()),
    notifier: createNotifier(notifyConfigFromEnv()),
    limiter: new RateLimiter(),
    retentionDays: Number(env('ENQUIRY_RETENTION_DAYS') ?? 90),
    acknowledge: env('NOTIFY_ACKNOWLEDGE') === 'true',
  };
}

let deps: EnquiryDeps | undefined;
let lastMaintenance = 0;

/** Shared dependencies for the running server. */
export function enquiryDeps(): EnquiryDeps {
  deps ??= createDepsFromEnv();
  // Opportunistic retry of earlier failed notifications, at most every five minutes.
  // A scheduled `npm run enquiries:retry` covers quiet periods.
  if (Date.now() - lastMaintenance > 5 * 60_000) {
    lastMaintenance = Date.now();
    const d = deps;
    void runMaintenance(d).catch((err) => console.error('[enquiry] maintenance failed', err));
  }
  return deps;
}

/**
 * Best-effort client key for rate limiting. Behind a proxy that sets X-Forwarded-For (Vercel always does),
 * set TRUST_PROXY=true. `getClientAddress` may throw on adapters that cannot determine it.
 */
export function clientKey(request: Request, getClientAddress: () => string): string {
  const trustProxy = env('TRUST_PROXY') === 'true' || Boolean(env('VERCEL'));
  const forwarded = trustProxy ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() : undefined;
  if (forwarded) return forwarded;
  try {
    return getClientAddress() || 'unknown';
  } catch {
    return 'unknown';
  }
}
