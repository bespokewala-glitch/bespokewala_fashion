/**
 * imageUrl.ts — Shared image URL utilities
 *
 * Architecture:
 *   GCS bucket is PRIVATE.
 *   All product/admin images are served through the authenticated proxy:
 *     /api/media/<gcs-key>
 *   The browser NEVER talks to GCS directly.
 *
 * URL formats that may exist in MongoDB:
 *   1. (current)  /api/media/uploads/filename.png
 *   2. (legacy)   /api/media?file=uploads/filename.png
 *   3. (stale)    https://storage.googleapis.com/bespokewala-storage/uploads/filename.png
 *                 created by a temporary bad commit — rewritten to proxy URL
 *   4. (public)   https://images.unsplash.com/...  — kept as-is
 *
 * Safe to import in both server and client components.
 * Contains NO secrets and NO GCS credentials.
 */

const GCS_BUCKET = 'bespokewala-storage';
const GCS_BASE   = `https://storage.googleapis.com/${GCS_BUCKET}/`;

/**
 * Normalize any image URL to a browser-safe URL.
 *
 * Returns:
 *  - /api/media/<key>  for private GCS images (served by the authenticated proxy)
 *  - the original URL  for public images (Unsplash, etc.)
 *  - ''                for null / undefined / empty / malformed
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string' || url.trim() === '') return '';

  const trimmed = url.trim();

  // Already a correct proxy URL
  if (trimmed.startsWith('/api/media/')) return trimmed;

  // Legacy query-param proxy format:
  // /api/media?file=uploads/foo.png  ->  /api/media/uploads/foo.png
  if (trimmed.startsWith('/api/media?file=')) {
    const key = trimmed.replace('/api/media?file=', '');
    return `/api/media/${key}`;
  }

  // Stale direct GCS CDN URL (private bucket) — rewrite to proxy:
  // https://storage.googleapis.com/bespokewala-storage/uploads/foo.png
  // -> /api/media/uploads/foo.png
  if (trimmed.startsWith(GCS_BASE)) {
    const gcsKey = trimmed.slice(GCS_BASE.length);
    // Guard: never create /api/media/https://... garbage
    if (gcsKey && !gcsKey.startsWith('http')) {
      return `/api/media/${gcsKey}`;
    }
  }

  // Bare /uploads/ path (missing /api/media prefix) — old jewellery products
  if (trimmed.startsWith('/uploads/')) {
    return `/api/media${trimmed}`;
  }

  // Public external URL (Unsplash, CDN, etc.) — keep as-is
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }

  // Other relative paths
  if (trimmed.startsWith('/')) return trimmed;

  // Unrecognised / malformed
  return '';
}

/**
 * Returns true when the URL must bypass Next.js Image Optimization.
 *
 * The Vercel image optimizer cannot recursively call back into the same
 * serverless deployment (/api/media/...).  Use this as the `unoptimized`
 * prop on every <Image> that may receive a proxy URL.
 *
 * Usage:
 *   <Image src={src} unoptimized={shouldBypassOptimizer(src)} ... />
 */
export function shouldBypassOptimizer(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith('/api/');
}
