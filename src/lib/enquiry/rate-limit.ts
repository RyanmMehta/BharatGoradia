// Simple per-client sliding-window limiter (PRD §10: start with rate limits).
// In-memory, so it applies per server process. That is enough for a single small server.
export class RateLimiter {
  private hits = new Map<string, number[]>();
  private limit: number;
  private windowMs: number;

  constructor(limit = 8, windowMs = 10 * 60 * 1000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  /** Records an attempt and returns false when the client is over the limit. */
  allow(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 10_000) this.prune(now);
    return true;
  }

  private prune(now: number) {
    for (const [k, v] of this.hits) if (v.every((t) => now - t >= this.windowMs)) this.hits.delete(k);
  }
}
