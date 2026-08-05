/**
 * GET /api/v1/media/serve/[id]
 *
 * Hardened streaming proxy for private GCS files (invoices, bills, documents).
 *
 * Security properties implemented here:
 *  [1] RESPONSE HEADERS    — Content-Type + Content-Length from GCS metadata;
 *                            Cache-Control: private, no-store; X-Content-Type-Options
 *  [2] STREAM ERROR HANDLING — GCS stream errors terminate the response cleanly;
 *                              client disconnects destroy the GCS stream to save resources
 *  [3] RATE LIMITING       — 30 req/min per authenticated user via existing rateLimit.ts
 *                            (Redis in prod, in-memory fallback in dev)
 *  [4] AUDIT LOGGING       — every access attempt (success + denied) written to AuditLog
 *                            collection; no signed URLs or file bytes are logged
 *
 * IDOR protection: non-owners receive 404 (same as missing) — no 403 that leaks existence
 * Streaming: GCS URL never sent to client — bytes flow server → client only
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Media from '@/models/Media';
import AuditLog from '@/models/AuditLog';
import { privateBucket } from '@/lib/gcs';
// [3] Reuse the existing rate limiter — adds 'serve' limit (30 req/min per user)
import { checkSingleLimit, rateLimitHeaders } from '@/lib/media/rateLimit';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generic 404 — used for both missing AND unauthorised (IDOR-safe). */
function notFound() {
  return NextResponse.json(
    { success: false, error: { code: 'NOT_FOUND', message: 'File not found.' } },
    { status: 404 }
  );
}

/**
 * [4] Write one audit log entry.
 * Fire-and-forget (no await) — we never want an audit write failure to
 * block or crash the main request path.
 * IMPORTANT: never log the signedUrl, file bytes, or any file contents.
 */
function audit(params: {
  userId: string | null;
  mediaId: string;
  outcome: 'success' | 'denied' | 'not_found' | 'rate_limited' | 'error';
  ip: string | null;
  meta?: Record<string, string | number | boolean>;
}) {
  AuditLog.create({
    action:      'private_file_access',
    user_id:     params.userId,
    resource_id: params.mediaId,
    outcome:     params.outcome,
    ip:          params.ip,
    meta:        params.meta,
  }).catch((err: Error) => {
    // Log to console but never let an audit write break the main flow
    console.error('[Serve] Audit write failed:', err.message);
  });
}

/** Extract the best available client IP from the request headers. */
function getClientIp(req: NextRequest): string | null {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null
  );
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);

  // ── 1. Authentication ──────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHENTICATED', message: 'You must be logged in.' } },
      { status: 401 }
    );
  }

  const payload = await verifyToken(token);
  if (!payload?.id) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHENTICATED', message: 'You must be logged in.' } },
      { status: 401 }
    );
  }

  const userId = payload.id as string;
  const resolvedParams = await params;
  const { id: mediaId } = resolvedParams;

  // MongoDB ObjectIds are exactly 24 hex chars — reject junk IDs before hitting the DB
  if (!/^[a-f\d]{24}$/i.test(mediaId)) {
    audit({ userId, mediaId, outcome: 'not_found', ip });
    return notFound();
  }

  // ── [3] Rate limiting ──────────────────────────────────────────────────────
  // Uses the 'serve' bucket (30 req/min per user) from rateLimit.ts.
  // checkSingleLimit reuses the same Redis/in-memory backend as the upload limiter.
  const rateResult = await checkSingleLimit('serve', `serve:${userId}`);
  if (!rateResult.allowed) {
    audit({ userId, mediaId, outcome: 'rate_limited', ip });
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait before retrying.' } },
      {
        status: 429,
        headers: {
          // Retry-After (seconds) tells clients exactly when to retry
          'Retry-After': String(rateResult.retryAfterSeconds ?? 60),
          ...rateLimitHeaders(0, 60_000),
        },
      }
    );
  }

  // ── 2. Load media record + authorise ──────────────────────────────────────
  await dbConnect();
  const media = await Media.findById(mediaId).lean();

  const isAdmin = payload.role === 'admin';
  const isOwner = media?.uploader_id === userId;

  // IDOR-safe: non-owners and missing records both get 404, never 403
  if (!media || !media.is_private || (!isAdmin && !isOwner)) {
    audit({
      userId,
      mediaId,
      outcome: !media ? 'not_found' : 'denied',
      ip,
      meta: { entity_type: media?.entity_type ?? 'unknown' },
    });
    return notFound();
  }

  // ── [1] + [2] Stream GCS object with hardened headers ─────────────────────
  try {
    const file = privateBucket.file(media.gcs_key);

    // [1] Fetch GCS object metadata to get authoritative Content-Type + Content-Length.
    //     This reuses the getMetadata() pattern from getGcsMetadata() in signedUrl.ts,
    //     but targets the private bucket and we need the raw size/contentType fields.
    let gcsContentType: string = media.mime_type || 'application/octet-stream';
    let gcsContentLength: number | null = null;

    try {
      const [meta] = await file.getMetadata();
      // Use GCS metadata as ground truth — more reliable than what was stored in DB at upload time
      if (meta.contentType) gcsContentType = meta.contentType as string;
      if (meta.size)        gcsContentLength = Number(meta.size);
    } catch (metaErr: any) {
      // Metadata fetch failure → object probably doesn't exist
      console.error(`[Serve] GCS metadata fetch failed for ${mediaId} (${media.gcs_key}):`, metaErr.message);
      audit({ userId, mediaId, outcome: 'not_found', ip, meta: { gcs_key: media.gcs_key } });
      return notFound();
    }

    // Build a safe download filename from the stored original_filename
    const rawName      = media.original_filename || media.gcs_key.split('/').pop() || 'file';
    const safeFilename = rawName.replace(/[^\w.\-]/g, '_');

    // [2] Create GCS read stream — all error cases handled explicitly
    const gcsStream = file.createReadStream();

    const webStream = new ReadableStream({
      start(controller) {
        gcsStream.on('data', (chunk: Buffer) => {
          controller.enqueue(chunk);
        });

        gcsStream.on('end', () => {
          controller.close();
        });

        // [2] Stream error (object deleted mid-transfer, network failure, permission revoked)
        //     → close the ReadableStream with an error so Next.js terminates the HTTP response
        //       cleanly rather than hanging or sending a truncated file silently.
        gcsStream.on('error', (err: Error) => {
          console.error(`[Serve] GCS stream error for media ${mediaId}:`, err.message);
          controller.error(err);
        });
      },

      // [2] Client disconnect — destroy the GCS read stream immediately.
      //     Without this, GCS keeps the connection open and streams data to /dev/null
      //     burning both GCS egress and backend memory.
      cancel() {
        gcsStream.destroy();
        console.log(`[Serve] Client disconnected mid-stream for media ${mediaId} — GCS stream destroyed.`);
      },
    });

    // [4] Audit successful access BEFORE streaming starts (stream errors logged separately)
    audit({
      userId,
      mediaId,
      outcome: 'success',
      ip,
      meta: {
        entity_type: media.entity_type,
        file_size_bytes: gcsContentLength ?? 0,
      },
    });

    // [1] Build response headers
    const responseHeaders: Record<string, string> = {
      // Content-Type from GCS metadata — authoritative, not client-supplied
      'Content-Type': gcsContentType,
      // Triggers browser "Save As" dialog with a clean filename
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      // [1] Never cache private files — not in browser, not in any shared proxy
      'Cache-Control': 'private, no-store',
      // Prevents MIME-sniffing attacks
      'X-Content-Type-Options': 'nosniff',
    };

    // [1] Content-Length — lets clients show accurate download progress bars.
    //     Only set if we have an exact size; skip for unknown-length streams.
    if (gcsContentLength !== null) {
      responseHeaders['Content-Length'] = String(gcsContentLength);
    }

    return new NextResponse(webStream, { status: 200, headers: responseHeaders });

  } catch (err: any) {
    console.error(`[Serve] Unexpected error for media ${mediaId}:`, err.message);
    audit({ userId, mediaId, outcome: 'error', ip, meta: { error: err.message } });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not retrieve file.' } },
      { status: 500 }
    );
  }
}