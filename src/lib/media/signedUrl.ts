/**
 * Google Cloud Storage signed URL generator.
 *
 * Generates V4 signed URLs so clients upload directly to GCS —
 * the file never touches our app server, keeping it lightweight
 * and enabling large file support without memory pressure.
 *
 * Also handles resumable (multipart) upload sessions for large videos.
 */

import { storage, bucket, bucketName, privateBucket } from '@/lib/gcs';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SignedUrlResult {
  /** URL the client should PUT/POST to */
  signedUrl: string;
  /** Headers the client must include in the upload request */
  headers: Record<string, string>;
  /** Expiry timestamp (Unix seconds) */
  expiresAt: number;
  /** GCS resumable upload session URI (only for resumable uploads) */
  uploadSessionUri?: string;
}

export interface SignedUrlOptions {
  gcsKey: string;
  mimeType: string;
  fileSizeBytes: number;
  /** Use resumable upload for large files (>5 MB recommended) */
  resumable?: boolean;
}

// ─── Simple signed URL (for images / small files ≤ 5 MB) ─────────────────────
/**
 * Generates a V4 signed PUT URL valid for 15 minutes.
 * Client PUTs the file directly to GCS using this URL.
 */
export async function generateSignedUploadUrl(
  options: SignedUrlOptions
): Promise<SignedUrlResult> {
  const EXPIRY_SECONDS = 15 * 60; // 15 minutes
  const expiresAt = Math.floor(Date.now() / 1000) + EXPIRY_SECONDS;

  const file = bucket.file(options.gcsKey);

  const [signedUrl] = await file.generateSignedPostPolicyV4({
    expires: new Date(expiresAt * 1000),
    conditions: [
      ['content-length-range', 1, options.fileSizeBytes],
      ['starts-with', '$Content-Type', options.mimeType.split('/')[0]],
    ],
    fields: {
      'Content-Type': options.mimeType,
      'Cache-Control': 'public, max-age=86400',
    },
  });

  return {
    signedUrl: signedUrl.url,
    headers: {
      'Content-Type': options.mimeType,
    },
    expiresAt,
    // Return the fields too so the client knows what form fields to include
  };
}

/**
 * Generates a V4 signed PUT URL (simpler, for direct PUT requests).
 */
export async function generateSignedPutUrl(
  options: SignedUrlOptions
): Promise<SignedUrlResult> {
  const EXPIRY_SECONDS = 15 * 60;
  const expiresAt = Math.floor(Date.now() / 1000) + EXPIRY_SECONDS;

  const file = bucket.file(options.gcsKey);

  const [signedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: expiresAt * 1000,
    contentType: options.mimeType,
    extensionHeaders: {
      'x-goog-content-length-range': `0,${options.fileSizeBytes}`,
    },
  });

  return {
    signedUrl,
    headers: {
      'Content-Type': options.mimeType,
      'x-goog-content-length-range': `0,${options.fileSizeBytes}`,
    },
    expiresAt,
  };
}

// ─── Resumable upload session (for videos > 5 MB) ────────────────────────────
/**
 * Initiates a GCS resumable upload session.
 * Returns the session URI the client uses to upload in chunks.
 *
 * The client then sends PUT requests to the session URI with
 * Content-Range headers for each chunk.
 *
 * @see https://cloud.google.com/storage/docs/resumable-uploads
 */
export async function generateResumableUploadUri(
  options: SignedUrlOptions
): Promise<SignedUrlResult> {
  const EXPIRY_SECONDS = 60 * 60; // 1 hour for large files
  const expiresAt = Math.floor(Date.now() / 1000) + EXPIRY_SECONDS;

  const file = bucket.file(options.gcsKey);

  // createResumableUpload returns the session URI
  const [uploadSessionUri] = await file.createResumableUpload({
    metadata: {
      contentType: options.mimeType,
      cacheControl: 'public, max-age=604800',
    },
    origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  });

  return {
    // For resumable uploads, the signedUrl IS the session URI
    signedUrl: uploadSessionUri,
    headers: {
      'Content-Type': options.mimeType,
    },
    expiresAt,
    uploadSessionUri,
  };
}

// ─── Read signed URL (for serving protected content) ─────────────────────────
/**
 * Generates a short-lived signed GET URL for accessing a private GCS object.
 * Use this if the bucket is NOT public — otherwise just use the CDN URL.
 */
export async function generateSignedReadUrl(
  gcsKey: string,
  expiryMinutes = 60
): Promise<string> {
  const file = bucket.file(gcsKey);
  const [signedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiryMinutes * 60 * 1000,
  });
  return signedUrl;
}

// ─── CDN URL builder ───────────────────────────────────────────────────────────────────
/**
 * Build the public CDN URL for a processed GCS object.
 * Returns '' for private entities — callers must use /api/v1/media/serve/[id] instead.
 */
export function buildCdnUrl(gcsKey: string, isPrivate = false): string {
  if (isPrivate) {
    // Never expose a URL for private files. The serve proxy generates them on demand.
    return '';
  }
  const cdnBase = process.env.CDN_BASE_URL;
  if (cdnBase) {
    return `${cdnBase.replace(/\/$/, '')}/${gcsKey}`;
  }
  // Fall back to public GCS URL
  return `https://storage.googleapis.com/${bucketName}/${gcsKey}`;
}

// ─── Private read URL (generated fresh on every request) ─────────────────────────
/**
 * Generates a short-lived V4 signed GET URL for a file in the PRIVATE bucket.
 *
 * This is called by /api/v1/media/serve/[id] on every authenticated request.
 * The URL lives for `expiryMinutes` (default 15) and is never stored anywhere.
 *
 * │ User requests file │
 *      ↓ backend authenticates + authorises
 * │ generatePrivateReadUrl() → fresh 15-min URL │
 *      ↓ client redirects to GCS → file served
 */
export async function generatePrivateReadUrl(
  gcsKey: string,
  expiryMinutes = 15,
  /** Optional human-readable filename for Content-Disposition (e.g. "invoice-1234.pdf") */
  filename?: string,
): Promise<string> {
  // Build a safe Content-Disposition header
  // - With filename → "attachment; filename="invoice-1234.pdf"" (triggers download)
  // - Without        → "inline" (browser renders/previews it)
  const safeFilename = filename
    ? filename.replace(/[^\w.\-]/g, '_')   // strip special chars
    : undefined;
  const responseDisposition = safeFilename
    ? `attachment; filename="${safeFilename}"`
    : 'inline';

  const [signedUrl] = await privateBucket.file(gcsKey).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiryMinutes * 60 * 1000,
    responseDisposition,
  });
  return signedUrl;
}

// ─── Delete object ────────────────────────────────────────────────────────────
export async function deleteGcsObject(gcsKey: string): Promise<void> {
  try {
    await bucket.file(gcsKey).delete();
  } catch (err: any) {
    // 404 is fine — object already gone
    if (err?.code !== 404) throw err;
  }
}

// ─── Check object exists ──────────────────────────────────────────────────────
export async function gcsObjectExists(gcsKey: string): Promise<boolean> {
  const [exists] = await bucket.file(gcsKey).exists();
  return exists;
}

// ─── Get object metadata ──────────────────────────────────────────────────────
export async function getGcsMetadata(gcsKey: string): Promise<{
  size: number;
  contentType: string;
  updated: Date;
} | null> {
  try {
    const [meta] = await bucket.file(gcsKey).getMetadata();
    return {
      size: Number(meta.size),
      contentType: meta.contentType as string,
      updated: new Date(meta.updated as string),
    };
  } catch {
    return null;
  }
}
