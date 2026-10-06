export const dynamic = 'force-dynamic';
/**
 * POST /api/v1/media/upload
 *
 * Generates a pre-signed URL for direct client→GCS upload.
 * The file never passes through this server — only metadata is validated here.
 *
 * Authentication:
 *   uploader_id is extracted from the verified JWT cookie ('token' or 'auth-token').
 *   It is NOT accepted from the request body — that would allow impersonation.
 *
 * Request body:
 * {
 *   entity_type: "product" | "review" | "banner" | "avatar" | "category",
 *   entity_id:   string,
 *   file_type:   "image" | "video",
 *   filename:    string,       // e.g. "photo.jpg"
 *   mime_type:   string,       // e.g. "image/jpeg"
 *   file_size:   number,       // bytes
 *   resumable?:  boolean,      // true for large videos (>5 MB)
 * }
 *
 * Response (200):
 * {
 *   success: true,
 *   media_id: string,
 *   upload_method: "put" | "resumable",
 *   signed_url: string,
 *   upload_session_uri?: string,
 *   upload_headers: Record<string, string>,
 *   expires_at: number,
 *   gcs_key: string,
 *   confirm_url: string,
 *   instructions: string,
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongoose';
import Media from '@/models/Media';
import { getEntityRule, buildStorageKey, formatBytes } from '@/lib/media/entityConfig';
import { checkRateLimit, rateLimitHeaders } from '@/lib/media/rateLimit';
import { generateSignedPutUrl, generateResumableUploadUri } from '@/lib/media/signedUrl';
import { verifyToken } from '@/lib/auth';
import type { EntityType, FileType } from '@/models/Media';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

function getExt(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function errorResponse(
  message: string,
  code: string,
  status: number,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    { success: false, error: { code, message, ...extra } },
    { status }
  );
}

/**
 * Extracts the authenticated user from the JWT cookie.
 * Tries both 'token' and 'auth-token' cookie names.
 * Returns null if no valid token is found.
 */
async function getAuthenticatedUser(): Promise<{ id: string, role?: string } | null> {
  const cookieStore = await cookies();
  const rawToken =
    cookieStore.get('token')?.value ||
    cookieStore.get('auth-token')?.value;

  if (!rawToken) return null;

  const decoded = await verifyToken(rawToken);
  if (!decoded) return null;
  const id = (decoded?.userId as string) ?? (decoded?.id as string);
  if (!id) return null;
  
  return { id, role: decoded?.role as string | undefined };
}

// ─── POST Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // ── 1. JWT Authentication ─────────────────────────────────────────────────
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return errorResponse(
        'Authentication required. Please log in before uploading.',
        'UNAUTHORIZED',
        401
      );
    }
    if (authUser.role !== 'admin') {
      return errorResponse(
        'Admin privileges required to upload media.',
        'FORBIDDEN',
        403
      );
    }
    const uploader_id = authUser.id;

    // ── 2. Parse body ─────────────────────────────────────────────────────────
    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Request body must be valid JSON.', 'INVALID_JSON', 400);
    }

    const {
      entity_type,
      entity_id,
      file_type,
      filename,
      mime_type,
      file_size,
      resumable = false,
    } = body;

    // Required fields (uploader_id is NOT in this list — it comes from JWT)
    const missing = ['entity_type', 'entity_id', 'file_type', 'filename', 'mime_type', 'file_size']
      .filter(f => !body[f]);
    if (missing.length) {
      return errorResponse(
        `Missing required fields: ${missing.join(', ')}.`,
        'MISSING_FIELDS',
        400,
        { missing_fields: missing }
      );
    }

    // ── 3. Enum validation ────────────────────────────────────────────────────
    const validEntityTypes: EntityType[] = ['product', 'review', 'banner', 'avatar', 'category'];
    const validFileTypes: FileType[] = ['image', 'video'];

    if (!validEntityTypes.includes(entity_type)) {
      return errorResponse(
        `Invalid entity_type "${entity_type}". Must be one of: ${validEntityTypes.join(', ')}.`,
        'INVALID_ENTITY_TYPE',
        400
      );
    }
    if (!validFileTypes.includes(file_type)) {
      return errorResponse(
        `Invalid file_type "${file_type}". Must be "image" or "video".`,
        'INVALID_FILE_TYPE',
        400
      );
    }
    if (typeof file_size !== 'number' || file_size <= 0) {
      return errorResponse('file_size must be a positive number (bytes).', 'INVALID_FILE_SIZE', 400);
    }

    // ── 4. Rate limiting (now async — supports Redis) ─────────────────────────
    const ip = getClientIp(req);
    const rateResult = await checkRateLimit(uploader_id, entity_type, ip ?? 'unknown');
    const rlHeaders = rateLimitHeaders(rateResult.remaining ?? 0, 60_000);

    if (!rateResult.allowed) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: `Too many upload requests. Try again in ${rateResult.retryAfterSeconds}s.`,
            retry_after_seconds: rateResult.retryAfterSeconds,
            limit_type: rateResult.limitType,
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateResult.retryAfterSeconds),
            ...rlHeaders,
          },
        }
      );
    }

    // ── 5. Entity rules lookup ────────────────────────────────────────────────
    let rule;
    try {
      rule = getEntityRule(entity_type as EntityType);
    } catch (e: any) {
      return errorResponse(e.message, 'INVALID_ENTITY_TYPE', 400);
    }

    // ── 6. File-type support check ────────────────────────────────────────────
    const allowedMimes = rule.allowedMimes[file_type as FileType];
    if (!allowedMimes || allowedMimes.length === 0) {
      return errorResponse(
        `${rule.label} uploads do not support file_type "${file_type}".`,
        'FILE_TYPE_NOT_SUPPORTED',
        400
      );
    }

    // ── 7. Declared MIME validation ───────────────────────────────────────────
    const normalizedMime = (mime_type as string).toLowerCase().split(';')[0].trim();
    if (!allowedMimes.includes(normalizedMime)) {
      return errorResponse(
        `MIME type "${normalizedMime}" is not allowed for ${rule.label}. Allowed: ${allowedMimes.join(', ')}.`,
        'MIME_NOT_ALLOWED',
        400,
        { allowed_mimes: allowedMimes }
      );
    }

    // ── 8. File size validation ───────────────────────────────────────────────
    const maxBytes = rule.maxFileSize[file_type as FileType];
    if (file_size > maxBytes) {
      return errorResponse(
        `File size ${formatBytes(file_size)} exceeds the ${formatBytes(maxBytes)} limit for ${rule.label} ${file_type}s.`,
        'FILE_TOO_LARGE',
        400,
        { max_bytes: maxBytes, received_bytes: file_size }
      );
    }

    // ── 9. Per-entity file count check ────────────────────────────────────────
    await dbConnect();
    const maxFiles = rule.maxFilesPerEntity[file_type as FileType];
    const existingCount = await Media.countDocuments({
      entity_type,
      entity_id,
      file_type,
      status: { $in: ['pending', 'uploading', 'processing', 'completed'] },
    });

    if (existingCount >= maxFiles) {
      return errorResponse(
        `Maximum of ${maxFiles} ${file_type}(s) allowed per ${rule.label} entity. Currently has ${existingCount}.`,
        'MAX_FILES_EXCEEDED',
        400,
        { max_files: maxFiles, current_count: existingCount }
      );
    }

    // ── 10. Build GCS storage key ─────────────────────────────────────────────
    const uploadId = randomUUID();
    const ext = getExt(filename as string) || (file_type === 'image' ? 'jpg' : 'mp4');
    const gcsKey = buildStorageKey(entity_type as EntityType, entity_id, uploadId, ext);

    // ── 11. Create Media record (status = pending) ────────────────────────────
    const mediaRecord = await Media.create({
      entity_type,
      entity_id,
      uploader_id,                        // from JWT — not from body
      file_type,
      original_filename: filename,
      mime_type: normalizedMime,
      file_size,
      gcs_key: gcsKey,
      gcs_bucket: process.env.GOOGLE_CLOUD_BUCKET_NAME || '',
      status: 'pending',
    });

    // ── 12. Generate pre-signed URL ───────────────────────────────────────────
    const useResumable = resumable || file_size > 5 * 1024 * 1024;

    const urlResult = useResumable
      ? await generateResumableUploadUri({ gcsKey, mimeType: normalizedMime, fileSizeBytes: file_size, resumable: true })
      : await generateSignedPutUrl({ gcsKey, mimeType: normalizedMime, fileSizeBytes: file_size });

    // ── 13. Transition record to 'uploading' ─────────────────────────────────
    await Media.findByIdAndUpdate(mediaRecord._id, {
      status: 'uploading',
      upload_id: uploadId,
    }, { returnDocument: 'after' });

    // ── 14. Respond ───────────────────────────────────────────────────────────
    return new NextResponse(
      JSON.stringify({
        success: true,
        media_id: mediaRecord._id.toString(),
        upload_method: useResumable ? 'resumable' : 'put',
        signed_url: urlResult.signedUrl,
        ...(urlResult.uploadSessionUri ? { upload_session_uri: urlResult.uploadSessionUri } : {}),
        upload_headers: urlResult.headers,
        expires_at: urlResult.expiresAt,
        gcs_key: gcsKey,
        confirm_url: '/api/v1/media/confirm',
        instructions: useResumable
          ? 'Upload file chunks via PUT to signed_url with Content-Range headers. Call confirm_url when complete.'
          : 'PUT file directly to signed_url with upload_headers. Call confirm_url when complete.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...rlHeaders },
      }
    );
  } catch (err: any) {
    console.error('[Media Upload] Error:', err);
    return errorResponse('Internal server error. Please try again.', 'INTERNAL_ERROR', 500);
  }
}

// ─── GET — list media for an entity ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const entity_type = searchParams.get('entity_type');
    const entity_id   = searchParams.get('entity_id');
    const status      = searchParams.get('status');
    const page        = parseInt(searchParams.get('page')  ?? '1',  10);
    const limit       = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);

    if (!entity_type || !entity_id) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_PARAMS', message: 'entity_type and entity_id are required.' } },
        { status: 400 }
      );
    }

    const filter: Record<string, unknown> = { entity_type, entity_id };
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      Media.find(filter).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Media.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error.' } },
      { status: 500 }
    );
  }
}

