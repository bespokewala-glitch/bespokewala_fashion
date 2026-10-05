import dbConnect from '@/lib/mongoose';
import AuditLog, { AuditAction, AuditTargetType, AuditOutcome } from '@/models/AuditLog';

export interface LogAdminActionParams {
  /** The namespaced action (e.g. 'product.created') */
  action: AuditAction;
  /** MongoDB user _id of the acting admin */
  actor_id?: string | null;
  /** Email address of the acting admin */
  actor_email?: string | null;
  /** Category of the affected resource */
  target_type: AuditTargetType;
  /** ID of the specific document being mutated */
  target_id?: string | null;
  /** Outcome — defaults to 'success' */
  outcome?: AuditOutcome;
  /** Pre-resolved IP (overrides extraction from req) */
  ip?: string | null;
  /** Sanitized metadata context */
  meta?: Record<string, any>;
  /** The original Request object (used to extract IP + user-agent) */
  req?: Request;
}

/**
 * Extracts client IP from common proxy headers.
 */
export function getRequestIp(req?: Request): string | null {
  if (!req) return null;
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    null
  );
}

/** Keys whose values must never be persisted. */
const FORBIDDEN_KEYS = new Set([
  'password', 'passwordhash', 'hash', 'token', 'accesstoken', 'refreshtoken',
  'secret', 'apikey', 'api_key', 'key', 'privatekey', 'private_key',
  'smtp_pass', 'smtppass', 'smtp_password', 'razorpay_key_secret', 'auth',
  'authorization', 'cookie', 'set-cookie',
]);

/**
 * Recursively sanitizes metadata — redacts any field whose key matches a
 * forbidden token so that passwords and secrets never reach MongoDB.
 */
export function sanitizeMeta(meta?: Record<string, any>): Record<string, any> | undefined {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return undefined;

  const sanitized: Record<string, any> = {};
  for (const [k, v] of Object.entries(meta)) {
    const keyLower = k.toLowerCase().replace(/[_\-\s]/g, '');
    if (FORBIDDEN_KEYS.has(keyLower)) {
      sanitized[k] = '[REDACTED]';
    } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      sanitized[k] = sanitizeMeta(v);
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

/**
 * Asynchronously persists an administrative action to the immutable AuditLog
 * collection. Non-blocking: any failure is logged to console only — it will
 * never crash or delay the caller.
 */
export async function logAdminAction(params: LogAdminActionParams): Promise<void> {
  // Fire-and-forget — do NOT await in hot paths
  (async () => {
    try {
      await dbConnect();

      const clientIp = params.ip ?? getRequestIp(params.req) ?? null;
      const userAgent = params.req?.headers.get('user-agent') ?? null;

      await AuditLog.create({
        action:      params.action,
        actor_id:    params.actor_id    ?? null,
        actor_email: params.actor_email ?? null,
        target_type: params.target_type,
        target_id:   params.target_id   ?? null,
        outcome:     params.outcome     ?? 'success',
        ip:          clientIp,
        user_agent:  userAgent,
        meta:        sanitizeMeta(params.meta),
      });
    } catch (err: any) {
      // Audit failure must never surface to clients
      console.error('[AuditLog] Failed to persist record:', err?.message ?? err);
    }
  })();
}
