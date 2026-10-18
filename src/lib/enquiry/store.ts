// Durable enquiry storage (PRD §10, §15). Enquiries are private: nothing here is exposed to
// public content APIs or pages.
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { DatabaseSync as DatabaseSyncType } from 'node:sqlite';
import { createRequire } from 'node:module';
import type { EnquiryInput } from './validate.ts';

export type DeliveryState = 'pending' | 'delivered' | 'failed';
export type AckState = 'not-required' | 'pending' | 'sent' | 'failed';

export interface Enquiry extends EnquiryInput {
  id: string;
  requestId: string;
  createdAt: string;
  deliveryState: DeliveryState;
  deliveryAttempts: number;
  lastAttemptAt: string | null;
  lastError: string | null;
  ackState: AckState;
  alerted: boolean;
  retainUntil: string;
}

export interface SaveResult {
  created: boolean;
  enquiry: Enquiry;
}

export type EnquiryPatch = Partial<
  Pick<Enquiry, 'deliveryState' | 'deliveryAttempts' | 'lastAttemptAt' | 'lastError' | 'ackState' | 'alerted'>
>;

// Store methods are async so the same service code runs on Node's SQLite and on Cloudflare D1.
export interface EnquiryStore {
  /** Idempotent: the same requestId, or an identical message within the duplicate window, returns the existing record. */
  save(input: EnquiryInput, opts: { requestId: string; now: Date; retentionDays: number; ack: boolean }): Promise<SaveResult>;
  get(id: string): Promise<Enquiry | undefined>;
  update(id: string, patch: EnquiryPatch): Promise<void>;
  /** Enquiries whose notification has not yet been delivered. */
  undelivered(): Promise<Enquiry[]>;
  /** Delete enquiries past their retention date. Returns the number removed. */
  purgeExpired(now: Date): Promise<number>;
}

export const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

export const fingerprint = (i: EnquiryInput) =>
  createHash('sha256').update([i.name, i.email, i.phone, i.message].join('\u0000')).digest('hex');

const retainUntil = (now: Date, days: number) => new Date(now.getTime() + days * 86_400_000).toISOString();

export function newRecord(input: EnquiryInput, opts: Parameters<EnquiryStore['save']>[1]): Enquiry {
  return {
    ...input,
    id: randomUUID(),
    requestId: opts.requestId,
    createdAt: opts.now.toISOString(),
    deliveryState: 'pending',
    deliveryAttempts: 0,
    lastAttemptAt: null,
    lastError: null,
    ackState: opts.ack ? 'pending' : 'not-required',
    alerted: false,
    retainUntil: retainUntil(opts.now, opts.retentionDays),
  };
}

/** In-memory store for tests and local experiments. Not durable. */
export class MemoryEnquiryStore implements EnquiryStore {
  private rows = new Map<string, Enquiry & { fingerprint: string }>();

  async save(input: EnquiryInput, opts: Parameters<EnquiryStore['save']>[1]): Promise<SaveResult> {
    const fp = fingerprint(input);
    for (const row of this.rows.values()) {
      const recent = opts.now.getTime() - Date.parse(row.createdAt) < DUPLICATE_WINDOW_MS;
      if (row.requestId === opts.requestId || (row.fingerprint === fp && recent))
        return { created: false, enquiry: strip(row) };
    }
    const enquiry = newRecord(input, opts);
    this.rows.set(enquiry.id, { ...enquiry, fingerprint: fp });
    return { created: true, enquiry };
  }
  async get(id: string) {
    const r = this.rows.get(id);
    return r && strip(r);
  }
  async update(id: string, patch: EnquiryPatch) {
    const r = this.rows.get(id);
    if (r) Object.assign(r, patch);
  }
  async undelivered() {
    return [...this.rows.values()].filter((r) => r.deliveryState !== 'delivered').map(strip);
  }
  async purgeExpired(now: Date) {
    let n = 0;
    for (const [id, r] of this.rows) if (Date.parse(r.retainUntil) <= now.getTime()) (this.rows.delete(id), n++);
    return n;
  }
}

function strip<T extends Enquiry>(r: T): Enquiry {
  const { fingerprint: _fp, ...rest } = r as T & { fingerprint?: string };
  return { ...rest };
}

/** Table definition shared by the SQLite and Cloudflare D1 stores. */
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS enquiries (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  fingerprint TEXT NOT NULL,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  delivery_state TEXT NOT NULL,
  delivery_attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT,
  last_error TEXT,
  ack_state TEXT NOT NULL,
  alerted INTEGER NOT NULL DEFAULT 0,
  retain_until TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS enquiries_fingerprint ON enquiries (fingerprint, created_at);
CREATE INDEX IF NOT EXISTS enquiries_delivery ON enquiries (delivery_state);
CREATE INDEX IF NOT EXISTS enquiries_retention ON enquiries (retain_until);
`;

/** SQLite store using Node's built-in driver (no native dependencies). */
export class SqliteEnquiryStore implements EnquiryStore {
  private db: DatabaseSyncType;

  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    // Loaded lazily so the module can be imported where node:sqlite is unavailable (e.g. tests using MemoryEnquiryStore).
    const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');
    this.db = new DatabaseSync(path);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = FULL;
      ${SCHEMA}
    `);
  }

  async save(input: EnquiryInput, opts: Parameters<EnquiryStore['save']>[1]): Promise<SaveResult> {
    const fp = fingerprint(input);
    const since = new Date(opts.now.getTime() - DUPLICATE_WINDOW_MS).toISOString();
    const existing = this.db
      .prepare('SELECT * FROM enquiries WHERE request_id = ? OR (fingerprint = ? AND created_at >= ?) LIMIT 1')
      .get(opts.requestId, fp, since);
    if (existing) return { created: false, enquiry: fromRow(existing) };

    const e = newRecord(input, opts);
    try {
      this.db
        .prepare(
          `INSERT INTO enquiries (id, request_id, fingerprint, created_at, name, email, phone, message,
             delivery_state, delivery_attempts, ack_state, alerted, retain_until)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?)`,
        )
        .run(e.id, e.requestId, fp, e.createdAt, e.name, e.email, e.phone, e.message, e.deliveryState, e.ackState, e.retainUntil);
    } catch (err) {
      // A concurrent request with the same requestId won the race: return that record.
      const row = this.db.prepare('SELECT * FROM enquiries WHERE request_id = ?').get(opts.requestId);
      if (row) return { created: false, enquiry: fromRow(row) };
      throw err;
    }
    return { created: true, enquiry: e };
  }

  async get(id: string) {
    const row = this.db.prepare('SELECT * FROM enquiries WHERE id = ?').get(id);
    return row ? fromRow(row) : undefined;
  }

  async update(id: string, patch: EnquiryPatch) {
    const update = updateStatement(patch);
    if (update) this.db.prepare(update.sql).run(...update.values, id);
  }

  async undelivered() {
    return this.db
      .prepare("SELECT * FROM enquiries WHERE delivery_state != 'delivered' ORDER BY created_at")
      .all()
      .map(fromRow);
  }

  async purgeExpired(now: Date) {
    const result = this.db.prepare('DELETE FROM enquiries WHERE retain_until <= ?').run(now.toISOString());
    return Number(result.changes);
  }
}

/** Builds `UPDATE … WHERE id = ?` for a patch; the caller appends the id. */
export function updateStatement(patch: EnquiryPatch) {
  const cols: Record<string, string> = {
    deliveryState: 'delivery_state',
    deliveryAttempts: 'delivery_attempts',
    lastAttemptAt: 'last_attempt_at',
    lastError: 'last_error',
    ackState: 'ack_state',
    alerted: 'alerted',
  };
  const entries = Object.entries(patch).filter(([k]) => k in cols);
  if (!entries.length) return null;
  return {
    sql: `UPDATE enquiries SET ${entries.map(([k]) => `${cols[k]} = ?`).join(', ')} WHERE id = ?`,
    values: entries.map(([, v]) => (typeof v === 'boolean' ? Number(v) : (v as string | number | null))),
  };
}

export function fromRow(r: Record<string, unknown>): Enquiry {
  return {
    id: String(r.id),
    requestId: String(r.request_id),
    createdAt: String(r.created_at),
    name: String(r.name),
    email: String(r.email),
    phone: String(r.phone),
    message: String(r.message),
    deliveryState: r.delivery_state as DeliveryState,
    deliveryAttempts: Number(r.delivery_attempts),
    lastAttemptAt: (r.last_attempt_at as string | null) ?? null,
    lastError: (r.last_error as string | null) ?? null,
    ackState: r.ack_state as AckState,
    alerted: Boolean(r.alerted),
    retainUntil: String(r.retain_until),
  };
}
