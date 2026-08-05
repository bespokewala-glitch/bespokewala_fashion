/**
 * GET    /api/v1/media/[id]  — Get media status and URLs
 * DELETE /api/v1/media/[id]  — Delete media record + GCS objects
 * PATCH  /api/v1/media/[id]  — Retry failed processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongoose';
import Media from '@/models/Media';
import { deleteGcsObject } from '@/lib/media/signedUrl';
import { getEntityRule } from '@/lib/media/entityConfig';
import { enqueueProcessingJob } from '@/lib/media/processMediaJob';
import { verifyToken } from '@/lib/auth';
import type { EntityType } from '@/models/Media';

async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const rawToken =
    cookieStore.get('token')?.value ||
    cookieStore.get('auth-token')?.value;
  if (!rawToken) return null;
  const decoded = await verifyToken(rawToken);
  return (decoded?.userId as string) ?? (decoded?.id as string) ?? null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

// ─── GET /api/v1/media/[id] ───────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const media = await Media.findById(id).lean();
    if (!media) {
      return errorResponse(`Media ${id} not found.`, 'NOT_FOUND', 404);
    }

    const rule = getEntityRule(media.entity_type as EntityType);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: media._id,
          entity_type: media.entity_type,
          entity_id: media.entity_id,
          uploader_id: media.uploader_id,
          file_type: media.file_type,
          original_filename: media.original_filename,
          mime_type: media.mime_type,
          file_size: media.file_size,
          status: media.status,
          error_message: media.error_message,
          retry_count: media.retry_count,

          // URLs (only available when status = completed)
          file_url: media.file_url || null,
          thumbnail_url: media.thumbnail_url || null,
          medium_url: media.medium_url || null,
          webp_url: media.webp_url || null,
          hls_url: media.hls_url || null,

          // Media metadata
          width: media.width || null,
          height: media.height || null,
          duration: media.duration || null,

          // Security
          is_malware_scanned: media.is_malware_scanned,
          malware_scan_result: media.malware_scan_result || null,

          // Timestamps
          created_at: media.created_at,
          updated_at: media.updated_at,
          completed_at: media.completed_at || null,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': media.status === 'completed'
            ? `public, max-age=${rule.cacheTtl}`
            : 'no-store',
        },
      }
    );
  } catch (err: any) {
    console.error('[Media GET]', err);
    return errorResponse('Internal server error.', 'INTERNAL_ERROR', 500);
  }
}

// ─── DELETE /api/v1/media/[id] ────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Auth — uploader_id comes from JWT, not the body
    const authenticated_uploader_id = await getAuthenticatedUserId();
    if (!authenticated_uploader_id) {
      return errorResponse('Authentication required.', 'UNAUTHORIZED', 401);
    }

    const media = await Media.findById(id);
    if (!media) {
      return errorResponse(`Media ${id} not found.`, 'NOT_FOUND', 404);
    }

    // Only the original uploader (or admin) can delete
    if (media.uploader_id !== authenticated_uploader_id) {
      return errorResponse('You are not authorized to delete this media.', 'FORBIDDEN', 403);
    }

    // Delete GCS objects: original + all derivatives
    const keysToDelete: string[] = [media.gcs_key];
    if (media.thumbnail_url) keysToDelete.push(media.gcs_key.replace(/\.[^.]+$/, '_thumb.webp'));
    if (media.medium_url)    keysToDelete.push(media.gcs_key.replace(/\.[^.]+$/, '_md.webp'));
    if (media.webp_url)      keysToDelete.push(media.gcs_key.replace(/\.[^.]+$/, '.webp'));

    await Promise.allSettled(keysToDelete.map(key => deleteGcsObject(key)));
    await Media.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: `Media ${id} and all derivatives deleted.` });
  } catch (err: any) {
    console.error('[Media DELETE]', err);
    return errorResponse('Internal server error.', 'INTERNAL_ERROR', 500);
  }
}

// ─── PATCH /api/v1/media/[id] — Retry failed processing ──────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Auth
    const authenticated_uploader_id = await getAuthenticatedUserId();
    if (!authenticated_uploader_id) {
      return errorResponse('Authentication required.', 'UNAUTHORIZED', 401);
    }

    const media = await Media.findById(id);
    if (!media) {
      return errorResponse(`Media ${id} not found.`, 'NOT_FOUND', 404);
    }

    if (media.uploader_id !== authenticated_uploader_id) {
      return errorResponse('You are not authorized to retry this upload.', 'FORBIDDEN', 403);
    }

    if (media.status !== 'failed') {
      return errorResponse(
        `Only failed uploads can be retried. Current status: "${media.status}".`,
        'INVALID_STATUS_TRANSITION',
        409
      );
    }

    const MAX_RETRIES = 3;
    if (media.retry_count >= MAX_RETRIES) {
      return errorResponse(
        `Maximum retry attempts (${MAX_RETRIES}) exceeded.`,
        'MAX_RETRIES_EXCEEDED',
        429
      );
    }

    // Transition back to processing
    await Media.findByIdAndUpdate(
      id,
      { status: 'processing', $unset: { error_message: '' } },
      { returnDocument: 'after' }
    );

    // Enqueue via Cloud Tasks or setImmediate — never fire-and-forget HTTP
    await enqueueProcessingJob(id);

    return NextResponse.json({
      success: true,
      media_id: id,
      status: 'processing',
      message: 'Retry enqueued.',
      status_url: `/api/v1/media/${id}`,
    });
  } catch (err: any) {
    return errorResponse('Internal server error.', 'INTERNAL_ERROR', 500);
  }
}
