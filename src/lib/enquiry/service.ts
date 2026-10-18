// Enquiry flow (PRD §10):
//   validate → store durably (idempotent) → report success → notify owner in the background,
//   retrying with backoff, alerting the owner after repeated failure, acknowledging the visitor once.
import { normalise, validate, validRequestId, type EnquiryInput, type FieldErrors } from './validate.ts';
import type { Enquiry, EnquiryStore } from './store.ts';
import type { Notifier } from './notify.ts';
import type { RateLimiter } from './rate-limit.ts';
import { randomUUID } from 'node:crypto';

export const MAX_DELIVERY_ATTEMPTS = 6;

export interface EnquiryDeps {
  store: EnquiryStore;
  notifier: Notifier;
  limiter: RateLimiter;
  retentionDays: number;
  acknowledge: boolean;
  now?: () => Date;
}

export type EnquiryResult =
  | { ok: true; id: string; created: boolean }
  | { ok: false; status: 422; errors: FieldErrors; values: EnquiryInput }
  | { ok: false; status: 400 | 429 | 500; formError: string; values: EnquiryInput };

export const FORM_ERRORS = {
  rateLimited:
    'Several messages have been sent from this connection in a short time. Please wait a few minutes and try again, or email Bharat directly.',
  unavailable:
    'Sorry, your message could not be saved just now. Nothing was sent. Please try again, or email Bharat directly.',
  badRequest: 'Sorry, something went wrong with the form. Please reload the page and try again.',
};

/**
 * `background` keeps the notification running after the response is sent. On Cloudflare Workers this
 * must be the request's waitUntil, or the work is cancelled; on a Node server it can be omitted.
 */
export async function submitEnquiry(
  raw: Record<string, unknown>,
  clientKey: string,
  deps: EnquiryDeps,
  background: (task: Promise<unknown>) => void = () => {},
): Promise<EnquiryResult> {
  const now = deps.now?.() ?? new Date();
  const values = normalise(raw);

  // Honeypot: real visitors never see or fill this field. Respond as if accepted, store nothing.
  if (typeof raw.website === 'string' && raw.website.trim() !== '') return { ok: true, id: 'received', created: false };

  // Validation comes first so that correcting mistakes never counts towards the rate limit.
  const errors = validate(values);
  if (Object.keys(errors).length) return { ok: false, status: 422, errors, values };

  if (!deps.limiter.allow(clientKey, now.getTime())) return { ok: false, status: 429, formError: FORM_ERRORS.rateLimited, values };

  // Without JavaScript there is no browser-generated id; the fingerprint check still prevents duplicates.
  const requestId = validRequestId(raw.requestId) ? raw.requestId : randomUUID();

  let saved;
  try {
    saved = await deps.store.save(values, { requestId, now, retentionDays: deps.retentionDays, ack: deps.acknowledge });
  } catch (err) {
    console.error('[enquiry] storage failed', err);
    return { ok: false, status: 500, formError: FORM_ERRORS.unavailable, values };
  }

  if (saved.created) {
    // Background delivery: success depends only on durable storage, never on email delivery.
    background(deliver(saved.enquiry.id, deps).catch((err) => console.error('[enquiry] delivery error', err)));
  }
  return { ok: true, id: saved.enquiry.id, created: saved.created };
}

/** Minutes to wait after `attempts` failed attempts before trying again: 1, 2, 4, 8, 16… */
export const backoffMinutes = (attempts: number) => 2 ** Math.max(0, attempts - 1);

function isDue(e: Enquiry, now: Date) {
  if (e.deliveryState === 'delivered') return false;
  if (!e.lastAttemptAt) return true;
  return now.getTime() - Date.parse(e.lastAttemptAt) >= backoffMinutes(e.deliveryAttempts) * 60_000;
}

/** Attempt owner notification (and the one-time acknowledgement) for a stored enquiry. */
export async function deliver(id: string, deps: EnquiryDeps): Promise<void> {
  const { store, notifier } = deps;
  const e = await store.get(id);
  if (!e) return;
  const now = deps.now?.() ?? new Date();

  if (e.deliveryState !== 'delivered') {
    try {
      await notifier.notifyOwner(e);
      await store.update(id, { deliveryState: 'delivered', deliveryAttempts: e.deliveryAttempts + 1, lastAttemptAt: now.toISOString(), lastError: null });
    } catch (err) {
      const attempts = e.deliveryAttempts + 1;
      const failed = attempts >= MAX_DELIVERY_ATTEMPTS;
      await store.update(id, {
        deliveryState: failed ? 'failed' : 'pending',
        deliveryAttempts: attempts,
        lastAttemptAt: now.toISOString(),
        lastError: err instanceof Error ? err.message.slice(0, 500) : 'Unknown error',
      });
      if (attempts >= 3 && !e.alerted) {
        try {
          await notifier.alert(
            'Website enquiry could not be delivered',
            `An enquiry (reference ${id}) was saved but the notification email has failed ${attempts} times.\n` +
              'The enquiry is safe in the enquiry store. docs/DEPLOY.md explains how to read it.',
          );
          await store.update(id, { alerted: true });
        } catch (alertErr) {
          console.error('[enquiry] alert failed', alertErr);
        }
      }
    }
  }

  // Acknowledge once. A failed acknowledgement is recorded and never retried, so visitors are not sent repeats.
  const latest = await store.get(id);
  if (latest?.ackState === 'pending') {
    try {
      await notifier.acknowledge(latest);
      await store.update(id, { ackState: 'sent' });
    } catch {
      await store.update(id, { ackState: 'failed' });
    }
  }
}

/** Retry due deliveries and purge expired enquiries. Run on a schedule (see scripts/enquiry-maintenance.mjs). */
export async function runMaintenance(deps: EnquiryDeps): Promise<{ retried: number; purged: number; failed: number }> {
  const now = deps.now?.() ?? new Date();
  const pending = (await deps.store.undelivered()).filter((e) => e.deliveryState === 'pending' && isDue(e, now));
  for (const e of pending) await deliver(e.id, deps);
  const purged = await deps.store.purgeExpired(now);
  const failed = (await deps.store.undelivered()).filter((e) => e.deliveryState === 'failed').length;
  return { retried: pending.length, purged, failed };
}
