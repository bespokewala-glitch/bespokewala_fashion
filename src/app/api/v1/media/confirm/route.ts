/**
 * POST /api/v1/media/confirm
 *
 * Called by the client AFTER it finishes uploading to GCS.
 * This endpoint:
 *   1. Verifies the file actually exists in GCS
 *   2. Validates actual file size from GCS metadata
 *   3. Reads first 16 bytes to verify MIME via magic bytes (spoofing prevention)
 *   4. Sets status = processing
 *   5. Enqueues background processing (Cloud Tasks or setImmediate)
 *
 * Request body:
 * { media_id: string }
 *
 * The uploader identity is taken from the JWT cookie — not the body.
 *
 * Response (200):
 * {
 *   success: true,
 *   media_id: string,
 *   status: "processing",
 *   status_url: "/api/v1/media/{id}"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongoose';
import Media from '@/models/Media';
import { getEntityRule } from '@/lib/media/entityConfig';
import { gcsObjectExists, getGcsMetadata } from '@/lib/media/signedUrl';
import { bucket } from '@/lib/gcs';
import { detectMimeFromBytes } from '@/lib/media/mimeValidator';
import { enqueueProcessingJob } from '@/lib/media/processMediaJob';
import { verifyToken } from '@/lib/auth';
import type { EntityType } from '@/models/Media';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const rawToken =
    cookieStore.get('token')?.value ||
    cookieStore.get('auth-token')?.value;
  if (!rawToken) return null;
  const decoded = await verifyToken(rawToken);
  return (decoded?.userId as string) ?? (decoded?.id as string) ?? null;
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // ── 1. JWT Authentication ─────────────────────────────────────────────────
    const authenticated_uploader_id = await getAuthenticatedUserId();
    if (!authenticated_uploader_id) {
      return errorResponse('Authentication required.', 'UNAUTHORIZED', 401);
    }

    // ── 2. Parse body ─────────────────────────────────────────────────────────
    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Request body must be valid JSON.', 'INVALID_JSON', 400);
    }

    const { media_id } = body;
    if (!media_id) {
      return errorResponse('media_id is required.', 'MISSING_FIELDS', 400);
    }

    // ── 3. Load Media record ──────────────────────────────────────────────────
    await dbConnect();
    const media = await Media.findById(media_id);

    if (!media) {
      return errorResponse(`Media record not found: ${media_id}`, 'NOT_FOUND', 404);
    }

    // ── 4. Authorization — only the original uploader can confirm ─────────────
    if (media.uploader_id !== authenticated_uploader_id) {
      return errorResponse(
        'You are not authorized to confirm this upload.',
        'FORBIDDEN',
        403
      );
    }

    // ── 5. Status guard — idempotent ──────────────────────────────────────────
    if (media.status === 'completed') {
      return NextResponse.json({
        success: true,
        media_id,
        status: 'completed',
        message: 'Upload already confirmed and processed.',
        file_url: media.file_url,
      });
    }

    if (media.status === 'processing') {
      return NextResponse.json({
        success: true,
        media_id,
        status: 'processing',
        message: 'Upload is already being processed.',
        status_url: `/api/v1/media/${media_id}`,
      });
    }

    if (!['pending', 'uploading', 'failed'].includes(media.status)) {
      return errorResponse(
        `Cannot confirm upload with status "${media.status}".`,
        'INVALID_STATUS_TRANSITION',
        409
      );
    }

    // ── 6. Verify file exists in GCS ──────────────────────────────────────────
    const exists = await gcsObjectExists(media.gcs_key);
    if (!exists) {
      await Media.findByIdAndUpdate(media_id, {
        status: 'failed',
        error_message: 'File not found in GCS after upload confirmation.',
      });
      return errorResponse(
        'File was not found in storage. The upload may not have completed successfully.',
        'FILE_NOT_IN_STORAGE',
        422
      );
    }

    // ── 7. Validate actual file size from GCS metadata ────────────────────────
    const gcsMeta = await getGcsMetadata(media.gcs_key);
    if (gcsMeta) {
      const rule = getEntityRule(media.entity_type as EntityType);
      const maxBytes = rule.maxFileSize[media.file_type];

      if (gcsMeta.size > maxBytes) {
        // Delete over-sized file and fail
        await bucket.file(media.gcs_key).delete().catch(() => {});
        await Media.findByIdAndUpdate(media_id, {
          status: 'failed',
          error_message: `Actual GCS file size (${gcsMeta.size} B) exceeds limit (${maxBytes} B).`,
        });
        return errorResponse(
          'The uploaded file exceeds the size limit for this entity type.',
          'FILE_TOO_LARGE',
          422
        );
      }

      // Authoritative size from GCS (may differ slightly from declared)
      media.file_size = gcsMeta.size;
    }

    // ── 8. Magic-byte MIME validation (reads only 16 bytes from GCS) ──────────
    let confirmedMime = media.mime_type;
    try {
      const chunks: Buffer[] = [];
      let bytesRead = 0;

      await new Promise<void>((resolve, reject) => {
        const stream = bucket.file(media.gcs_key).createReadStream({ start: 0, end: 15 });
        stream.on('data', (chunk: Buffer) => {
          const toRead = Math.min(chunk.length, 16 - bytesRead);
          chunks.push(chunk.slice(0, toRead));
          bytesRead += toRead;
          if (bytesRead >= 16) stream.destroy();
        });
        stream.on('end', resolve);
        stream.on('close', resolve);
        stream.on('error', reject);
      });

      const header = Buffer.concat(chunks).slice(0, bytesRead);
      const detectedMime = detectMimeFromBytes(header);

      if (detectedMime) {
        const rule = getEntityRule(media.entity_type as EntityType);
        const allowedMimes = rule.allowedMimes[media.file_type];

        if (!allowedMimes.includes(detectedMime)) {
          // MIME spoofing detected — delete from GCS, fail upload
          await bucket.file(media.gcs_key).delete().catch(() => {});
          await Media.findByIdAndUpdate(media_id, {
            status: 'failed',
            error_message: `Magic-byte MIME "${detectedMime}" not in allowed list.`,
          });
          return errorResponse(
            `File content type "${detectedMime}" is not allowed for this upload. Possible spoofing attempt.`,
            'MIME_MISMATCH',
            422
          );
        }

        confirmedMime = detectedMime; // use detected MIME as authoritative
      }
    } catch (mimeErr: any) {
      // Non-fatal — log and continue with declared MIME
      console.warn('[Confirm] Magic-byte check failed:', mimeErr.message);
    }

    // ── 9. Transition to processing ───────────────────────────────────────────
    await Media.findByIdAndUpdate(
      media_id,
      { status: 'processing', mime_type: confirmedMime, file_size: media.file_size },
      { returnDocument: 'after' }
    );

    // ── 10. Enqueue background job (Cloud Tasks or setImmediate) ──────────────
    // enqueueProcessingJob never throws — it logs and falls back gracefully.
    await enqueueProcessingJob(media_id);

    // ── 11. Respond immediately — don't wait for processing ───────────────────
    return NextResponse.json({
      success: true,
      media_id,
      status: 'processing',
      message: 'Upload confirmed. Processing has started in the background.',
      status_url: `/api/v1/media/${media_id}`,
    });

  } catch (err: any) {
    console.error('[Media Confirm] Error:', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error.' } },
      { status: 500 }
    );
  }
}

