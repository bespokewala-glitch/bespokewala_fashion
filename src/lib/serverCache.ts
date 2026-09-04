
/**
 * Lightweight in-memory cache for server-side DB query results.
 * Works in both dev and production (ISR only works in prod builds).
 *
 * Usage:
 *   const data = await getOrFetch('key', ttlSeconds, () => db.query());
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// Use global to survive Next.js hot-reload in dev
const globalCache = (global as any).__serverCache as Map<string, CacheEntry<any>> | undefined;
const cache: Map<string, CacheEntry<any>> = globalCache ?? new Map();
if (!(global as any).__serverCache) {
  (global as any).__serverCache = cache;
}

/**
 * Get a cached value or fetch it fresh.
 * @param key     Unique cache key
 * @param ttlSec  Time-to-live in seconds
 * @param fetcher Async function to fetch fresh data
 */
export async function getOrFetch<T>(
  key: string,
  ttlSec: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);

  if (hit && hit.expiresAt > now) {
    return hit.data as T;
  }

  const data = await fetcher();
  cache.set(key, { data, expiresAt: now + ttlSec * 1000 });
  return data;
}

/** Invalidate a specific cache key (call from admin actions after updates). */
export function invalidateCache(key: string) {
  cache.delete(key);
}

/** Invalidate all keys matching a prefix. */
export function invalidateCachePrefix(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}
