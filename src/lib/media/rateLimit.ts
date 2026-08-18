/**
 * Sliding-window rate limiter with Redis backend.
 *
 * Backend selection (automatic):
 *   • Redis   — when REDIS_URL env var is set (production, multi-instance)
 *   • Memory  — fallback for development / single-instance deployments
 *
 * All public functions are async to support both backends transparently.
 *
 * Redis install: npm install redis
 * Set in .env:   REDIS_URL=redis://localhost:6379
 */

// ─── Types ────────────────────────────────────────────────────────────────────
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const LIMITS: Record<string, RateLimitConfig> = {
  uploader:       { windowMs: 60_000,         maxRequests: 20 },   // 20/min per user  (upload)
  ip:             { windowMs: 60_000,         maxRequests: 40 },   // 40/min per IP    (upload)
  uploaderEntity: { windowMs: 60 * 60_000,    maxRequests: 30 },   // 30/hr per user+type (upload)
  // Private file serving — tighter window to prevent abuse and excessive GCS costs
  serve:          { windowMs: 60_000,         maxRequests: 30 },   // 30/min per user  (serve)
  auth:           { windowMs: 15 * 60_000,    maxRequests: 5 },    // 5/15min per IP   (auth)
};

export interface RateLimitResult {
  allowed: boolean;
  limitType?: 'uploader' | 'ip' | 'uploaderEntity';
  retryAfterMs?: number;
  retryAfterSeconds?: number;
  remaining: number;
}

// ─── Redis backend ────────────────────────────────────────────────────────────
let _redis: any = null;
let _redisAttempted = false;

async function getRedis(): Promise<any | null> {
  if (_redisAttempted) return _redis;
  _redisAttempted = true;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    const { createClient } = await import('redis');
    const client = createClient({ url });
    client.on('error', (err: Error) => {
      console.error('[RateLimit] Redis error:', err.message);
      _redis = null; // reset so next request retries
      _redisAttempted = false;
    });
    await client.connect();
    _redis = client;
    console.log('[RateLimit] Connected to Redis at', url);
    return _redis;
  } catch (err: any) {
    console.warn('[RateLimit] Redis unavailable, using in-memory fallback:', err.message);
    return null;
  }
}

/**
 * Redis sliding-window check using a sorted set.
 * Atomically removes expired entries, counts, and adds current timestamp.
 */
async function checkRedis(
  redis: any,
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; retryAfterMs?: number }> {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const fullKey = `rl:${key}`;

  const [, count] = await redis
    .multi()
    .zRemRangeByScore(fullKey, 0, windowStart)
    .zCard(fullKey)
    .zAdd(fullKey, { score: now, value: `${now}-${Math.random()}` })
    .expire(fullKey, Math.ceil(config.windowMs / 1000))
    .exec();

  const currentCount: number = count ?? 0;

  if (currentCount >= config.maxRequests) {
    // Find the oldest entry's timestamp to calculate retry-after
    const oldest = await redis.zRangeWithScores(fullKey, 0, 0);
    const oldestTs: number = oldest[0]?.score ?? now;
    const retryAfterMs = oldestTs + config.windowMs - now;
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  return { allowed: true, remaining: config.maxRequests - currentCount - 1 };
}

// ─── In-memory backend ────────────────────────────────────────────────────────
const memStore = new Map<string, number[]>();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const maxWindow = 60 * 60_000; // 1 hour (longest window)
    for (const [key, timestamps] of memStore.entries()) {
      const valid = timestamps.filter(t => now - t < maxWindow);
      if (valid.length === 0) memStore.delete(key);
      else memStore.set(key, valid);
    }
  }, 5 * 60_000);
}

function checkMemory(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; retryAfterMs?: number } {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let timestamps = (memStore.get(key) ?? []).filter(t => t > windowStart);

  if (timestamps.length >= config.maxRequests) {
    const retryAfterMs = timestamps[0] + config.windowMs - now;
    memStore.set(key, timestamps);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  timestamps = [...timestamps, now];
  memStore.set(key, timestamps);
  return { allowed: true, remaining: config.maxRequests - timestamps.length };
}

// ─── Core check ───────────────────────────────────────────────────────────────
async function checkOne(
  key: string,
  configKey: keyof typeof LIMITS,
  redis: any | null
): Promise<{ allowed: boolean; remaining: number; retryAfterMs?: number }> {
  const config = LIMITS[configKey];
  if (redis) {
    try {
      return await checkRedis(redis, key, config);
    } catch (err: any) {
      console.warn('[RateLimit] Redis check failed, falling back to memory:', err.message);
    }
  }
  return checkMemory(key, config);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check all three rate-limit buckets.
 * Returns the first exceeded limit or allowed=true.
 */
export async function checkRateLimit(
  uploaderId: string,
  entityType: string,
  ip: string
): Promise<RateLimitResult> {
  const redis = await getRedis();

  // 1. Per-uploader
  const u = await checkOne(`uploader:${uploaderId}`, 'uploader', redis);
  if (!u.allowed) {
    return { allowed: false, limitType: 'uploader', retryAfterMs: u.retryAfterMs, retryAfterSeconds: Math.ceil((u.retryAfterMs ?? 0) / 1000), remaining: 0 };
  }

  // 2. Per-IP
  const ip_ = await checkOne(`ip:${ip}`, 'ip', redis);
  if (!ip_.allowed) {
    return { allowed: false, limitType: 'ip', retryAfterMs: ip_.retryAfterMs, retryAfterSeconds: Math.ceil((ip_.retryAfterMs ?? 0) / 1000), remaining: 0 };
  }

  // 3. Per-uploader + entity_type
  const ue = await checkOne(`ue:${uploaderId}:${entityType}`, 'uploaderEntity', redis);
  if (!ue.allowed) {
    return { allowed: false, limitType: 'uploaderEntity', retryAfterMs: ue.retryAfterMs, retryAfterSeconds: Math.ceil((ue.retryAfterMs ?? 0) / 1000), remaining: 0 };
  }

  return { allowed: true, remaining: Math.min(u.remaining, ue.remaining) };
}

/**
 * Check a single named rate-limit bucket.
 * Used by endpoints that need just one limit (e.g. /serve/[id]).
 *
 * @param limitKey  - A value from LIMITS (e.g. 'serve')
 * @param identifier - Unique string for this user/IP (e.g. `serve:${userId}`)
 */
export async function checkSingleLimit(
  limitKey: keyof typeof LIMITS,
  identifier: string
): Promise<RateLimitResult> {
  const redis = await getRedis();
  const result = await checkOne(identifier, limitKey, redis);
  if (!result.allowed) {
    return {
      allowed: false,
      limitType: limitKey as any,
      retryAfterMs: result.retryAfterMs,
      retryAfterSeconds: Math.ceil((result.retryAfterMs ?? 0) / 1000),
      remaining: 0,
    };
  }
  return { allowed: true, remaining: result.remaining };
}

/**
 * Standard rate-limit response headers.
 */
export function rateLimitHeaders(remaining: number, windowMs: number): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(LIMITS.uploader.maxRequests),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil((Date.now() + windowMs) / 1000)),
  };
}
