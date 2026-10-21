import { Errors } from './errors';

// In-memory sliding-window rate limiter. Suitable for a single-instance MVP.
// For multi-instance deployments, replace with a shared store (Redis/Upstash).
type Bucket = { timestamps: number[] };

const store = new Map<string, Bucket>();
const WINDOW_MS = 60_000;

function key(prefix: string, id: string) {
  return `${prefix}:${id}`;
}

export function rateLimit(prefix: string, id: string, limit: number): void {
  const now = Date.now();
  const k = key(prefix, id);
  const bucket = store.get(k) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS);
  if (bucket.timestamps.length >= limit) {
    store.set(k, bucket);
    throw Errors.rateLimited();
  }
  bucket.timestamps.push(now);
  store.set(k, bucket);
}

// Periodic cleanup to bound memory usage.
const CLEANUP_MS = 5 * 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [k, bucket] of store.entries()) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS);
    if (bucket.timestamps.length === 0) store.delete(k);
  }
}, CLEANUP_MS);
