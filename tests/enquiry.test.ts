import { describe, expect, it } from 'vitest';
import { LIMITS, normalise, validate } from '../src/lib/enquiry/validate.ts';
import { MemoryEnquiryStore, SqliteEnquiryStore, type EnquiryStore } from '../src/lib/enquiry/store.ts';
import { LogNotifier, ownerEmail, type Notifier } from '../src/lib/enquiry/notify.ts';
import { RateLimiter } from '../src/lib/enquiry/rate-limit.ts';
import { deliver, MAX_DELIVERY_ATTEMPTS, runMaintenance, submitEnquiry, type EnquiryDeps } from '../src/lib/enquiry/service.ts';

const valid = { name: 'Asha Patel', email: 'asha@example.com', phone: '', message: 'We are planning a Diwali celebration.' };

class FlakyNotifier implements Notifier {
  owner = 0;
  acks = 0;
  alerts: string[] = [];
  constructor(public failOwner = true, public failAck = false) {}
  async notifyOwner() {
    this.owner++;
    if (this.failOwner) throw new Error('provider down');
  }
  async acknowledge() {
    this.acks++;
    if (this.failAck) throw new Error('ack failed');
  }
  async alert(subject: string) {
    this.alerts.push(subject);
  }
}

function makeDeps(over: Partial<EnquiryDeps> = {}, store: EnquiryStore = new MemoryEnquiryStore()): EnquiryDeps {
  return { store, notifier: new LogNotifier(), limiter: new RateLimiter(), retentionDays: 90, acknowledge: false, ...over };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('validation', () => {
  it('accepts a normal enquiry and normalises whitespace and case', () => {
    const input = normalise({ name: '  Asha   Patel ', email: ' ASHA@Example.com ', message: ' Hi \r\n there ' });
    expect(input).toEqual({ name: 'Asha Patel', email: 'asha@example.com', phone: '', message: 'Hi \n there' });
    expect(validate(input)).toEqual({});
  });

  it('reports every missing required field in plain language', () => {
    const errors = validate(normalise({}));
    expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'name']);
    expect(errors.email).toMatch(/email address/);
  });

  it('rejects malformed email and phone, but phone stays optional', () => {
    expect(validate({ ...valid, email: 'asha@example' }).email).toBeDefined();
    expect(validate({ ...valid, phone: 'call me' }).phone).toBeDefined();
    expect(validate({ ...valid, phone: '+44 (0)20 7946 0018' }).phone).toBeUndefined();
  });

  it('explains the message limit instead of truncating', () => {
    const errors = validate({ ...valid, message: 'x'.repeat(LIMITS.message + 1) });
    expect(errors.message).toMatch(/5,001 characters/);
  });

  it('ignores non-string input', () => {
    expect(normalise({ name: ['a'], email: { x: 1 }, message: 5 })).toEqual({ name: '', email: '', phone: '', message: '' });
  });
});

describe.each([
  ['memory', () => new MemoryEnquiryStore()],
  ['sqlite', () => new SqliteEnquiryStore(':memory:')],
])('%s store', (_name, make) => {
  const now = new Date('2026-10-15T12:00:00Z');

  it('is idempotent for a repeated request id', () => {
    const store = make();
    const a = store.save(valid, { requestId: 'req-aaaaaaaaaaaaaaaa', now, retentionDays: 90, ack: false });
    const b = store.save({ ...valid, message: 'edited' }, { requestId: 'req-aaaaaaaaaaaaaaaa', now, retentionDays: 90, ack: false });
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(b.enquiry.id).toBe(a.enquiry.id);
  });

  it('treats an identical message within ten minutes as a duplicate, but not after', () => {
    const store = make();
    const first = store.save(valid, { requestId: 'req-1111111111111111', now, retentionDays: 90, ack: false });
    const soon = store.save(valid, { requestId: 'req-2222222222222222', now: new Date(now.getTime() + 60_000), retentionDays: 90, ack: false });
    const later = store.save(valid, { requestId: 'req-3333333333333333', now: new Date(now.getTime() + 11 * 60_000), retentionDays: 90, ack: false });
    expect(soon.enquiry.id).toBe(first.enquiry.id);
    expect(later.created).toBe(true);
  });

  it('purges enquiries after the retention period only', () => {
    const store = make();
    store.save(valid, { requestId: 'req-4444444444444444', now, retentionDays: 90, ack: false });
    expect(store.purgeExpired(new Date(now.getTime() + 89 * 86_400_000))).toBe(0);
    expect(store.purgeExpired(new Date(now.getTime() + 90 * 86_400_000))).toBe(1);
    expect(store.undelivered()).toHaveLength(0);
  });
});

describe('submitEnquiry', () => {
  it('stores the enquiry and notifies the owner', async () => {
    const notifier = new LogNotifier();
    const deps = makeDeps({ notifier });
    const result = await submitEnquiry({ ...valid, requestId: 'abcdefabcdefabcdef' }, 'ip', deps);
    expect(result.ok).toBe(true);
    await flush();
    const id = (result as { id: string }).id;
    expect(deps.store.get(id)?.deliveryState).toBe('delivered');
    expect(notifier.sent).toEqual([{ kind: 'owner', id }]);
  });

  it('returns field errors with the visitor’s text intact', async () => {
    const result = await submitEnquiry({ name: 'Asha', email: 'nope', message: 'Keep me' }, 'ip', makeDeps());
    expect(result).toMatchObject({ ok: false, status: 422, values: { message: 'Keep me' } });
  });

  it('reports success even when the notification fails, and keeps the enquiry', async () => {
    const notifier = new FlakyNotifier(true);
    const deps = makeDeps({ notifier });
    const result = await submitEnquiry(valid, 'ip', deps);
    expect(result.ok).toBe(true);
    await flush();
    const stored = deps.store.get((result as { id: string }).id)!;
    expect(stored.deliveryState).toBe('pending');
    expect(stored.lastError).toBe('provider down');
  });

  it('does not store or notify for a filled honeypot', async () => {
    const notifier = new LogNotifier();
    const deps = makeDeps({ notifier });
    const result = await submitEnquiry({ ...valid, website: 'http://spam' }, 'ip', deps);
    expect(result.ok).toBe(true);
    expect(deps.store.undelivered()).toHaveLength(0);
    expect(notifier.sent).toHaveLength(0);
  });

  it('rate limits valid submissions but not corrections', async () => {
    const deps = makeDeps({ limiter: new RateLimiter(2, 60_000) });
    for (let i = 0; i < 5; i++) expect((await submitEnquiry({ ...valid, email: 'bad' }, 'ip', deps)).ok).toBe(false);
    expect((await submitEnquiry({ ...valid, message: 'one' }, 'ip', deps)).ok).toBe(true);
    expect((await submitEnquiry({ ...valid, message: 'two' }, 'ip', deps)).ok).toBe(true);
    expect(await submitEnquiry({ ...valid, message: 'three' }, 'ip', deps)).toMatchObject({ ok: false, status: 429 });
    expect((await submitEnquiry({ ...valid, message: 'other' }, 'other-ip', deps)).ok).toBe(true);
  });

  it('reports a storage failure without claiming success', async () => {
    const store = new MemoryEnquiryStore();
    store.save = () => {
      throw new Error('disk full');
    };
    const result = await submitEnquiry(valid, 'ip', makeDeps({}, store));
    expect(result).toMatchObject({ ok: false, status: 500, values: { message: valid.message } });
  });
});

describe('delivery retries', () => {
  it('backs off, alerts once after repeated failure, then stops at the limit', async () => {
    let clock = new Date('2026-10-15T12:00:00Z');
    const notifier = new FlakyNotifier(true);
    const deps = makeDeps({ notifier, now: () => clock });
    const { id } = (await submitEnquiry(valid, 'ip', deps)) as { id: string };
    await flush();
    expect(notifier.owner).toBe(1);

    // Not yet due: no retry within the backoff window.
    await runMaintenance(deps);
    expect(notifier.owner).toBe(1);

    for (let i = 0; i < 20; i++) {
      clock = new Date(clock.getTime() + 60 * 60_000);
      await runMaintenance(deps);
    }
    expect(notifier.owner).toBe(MAX_DELIVERY_ATTEMPTS);
    expect(notifier.alerts).toHaveLength(1);
    expect(deps.store.get(id)?.deliveryState).toBe('failed');
    expect(deps.store.get(id)?.message).toBe(valid.message);
  });

  it('acknowledges the visitor at most once, even when the owner notification is retried', async () => {
    let clock = new Date('2026-10-15T12:00:00Z');
    const notifier = new FlakyNotifier(true, false);
    const deps = makeDeps({ notifier, acknowledge: true, now: () => clock });
    const { id } = (await submitEnquiry(valid, 'ip', deps)) as { id: string };
    await flush();
    clock = new Date(clock.getTime() + 60 * 60_000);
    notifier.failOwner = false;
    await runMaintenance(deps);
    await deliver(id, deps);
    expect(notifier.acks).toBe(1);
    expect(deps.store.get(id)?.deliveryState).toBe('delivered');
  });

  it('does not retry a failed acknowledgement', async () => {
    const notifier = new FlakyNotifier(false, true);
    const deps = makeDeps({ notifier, acknowledge: true });
    const { id } = (await submitEnquiry(valid, 'ip', deps)) as { id: string };
    await flush();
    await deliver(id, deps);
    expect(notifier.acks).toBe(1);
    expect(deps.store.get(id)?.ackState).toBe('failed');
  });
});

describe('owner email', () => {
  it('keeps the subject to one line', () => {
    const e = { ...valid, name: 'Evil\r\nBcc: x@y.z', id: 'id', requestId: 'r', createdAt: new Date().toISOString() } as never;
    expect(ownerEmail(e, 'Site').subject).not.toMatch(/[\r\n]/);
  });
});
