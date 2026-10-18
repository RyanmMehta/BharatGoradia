// Enquiry store on Cloudflare D1 (SQLite as a service), used when the site runs on Cloudflare Workers.
// Same table, same idempotency and duplicate rules as SqliteEnquiryStore.
import type { EnquiryInput } from './validate.ts';
import {
  DUPLICATE_WINDOW_MS,
  SCHEMA,
  fingerprint,
  fromRow,
  newRecord,
  updateStatement,
  type EnquiryPatch,
  type EnquiryStore,
  type SaveResult,
} from './store.ts';

/** The parts of Cloudflare's D1Database binding this store uses. */
export interface D1Like {
  prepare(sql: string): D1StatementLike;
  batch(statements: D1StatementLike[]): Promise<unknown[]>;
}
interface D1StatementLike {
  bind(...values: unknown[]): D1StatementLike;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes?: number } }>;
}

export class D1EnquiryStore implements EnquiryStore {
  private readonly db: D1Like;
  private ready: Promise<void> | undefined;

  constructor(db: D1Like) {
    this.db = db;
  }

  /** Creates the table on first use, once per isolate. */
  private init() {
    this.ready ??= this.db
      .batch(
        SCHEMA.split(';')
          .map((sql) => sql.trim())
          .filter(Boolean)
          .map((sql) => this.db.prepare(sql)),
      )
      .then(() => undefined)
      .catch((err) => {
        this.ready = undefined;
        throw err;
      });
    return this.ready;
  }

  async save(input: EnquiryInput, opts: Parameters<EnquiryStore['save']>[1]): Promise<SaveResult> {
    await this.init();
    const fp = fingerprint(input);
    const since = new Date(opts.now.getTime() - DUPLICATE_WINDOW_MS).toISOString();
    const existing = await this.db
      .prepare('SELECT * FROM enquiries WHERE request_id = ? OR (fingerprint = ? AND created_at >= ?) LIMIT 1')
      .bind(opts.requestId, fp, since)
      .first();
    if (existing) return { created: false, enquiry: fromRow(existing) };

    const e = newRecord(input, opts);
    try {
      await this.db
        .prepare(
          `INSERT INTO enquiries (id, request_id, fingerprint, created_at, name, email, phone, message,
             delivery_state, delivery_attempts, ack_state, alerted, retain_until)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?)`,
        )
        .bind(e.id, e.requestId, fp, e.createdAt, e.name, e.email, e.phone, e.message, e.deliveryState, e.ackState, e.retainUntil)
        .run();
    } catch (err) {
      // A concurrent request with the same requestId won the race: return that record.
      const row = await this.db.prepare('SELECT * FROM enquiries WHERE request_id = ?').bind(opts.requestId).first();
      if (row) return { created: false, enquiry: fromRow(row) };
      throw err;
    }
    return { created: true, enquiry: e };
  }

  async get(id: string) {
    await this.init();
    const row = await this.db.prepare('SELECT * FROM enquiries WHERE id = ?').bind(id).first();
    return row ? fromRow(row) : undefined;
  }

  async update(id: string, patch: EnquiryPatch) {
    await this.init();
    const update = updateStatement(patch);
    if (update) await this.db.prepare(update.sql).bind(...update.values, id).run();
  }

  async undelivered() {
    await this.init();
    const { results } = await this.db
      .prepare("SELECT * FROM enquiries WHERE delivery_state != 'delivered' ORDER BY created_at")
      .all();
    return results.map(fromRow);
  }

  async purgeExpired(now: Date) {
    await this.init();
    const result = await this.db.prepare('DELETE FROM enquiries WHERE retain_until <= ?').bind(now.toISOString()).run();
    return Number(result.meta.changes ?? 0);
  }
}
