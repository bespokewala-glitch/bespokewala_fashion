/**
 * imageUrl.ts — Shared image URL utilities
 *
 * Architecture:
 *   GCS bucket is PRIVATE.
 *   All product/admin images are served through the authenticated proxy:
 *     /api/media/<gcs-key>
 *   The browser NEVER talks to GCS directly.
 *
 * URL formats that may exist in MongoDB or localStorage:
 *   1. (current)  /api/media/uploads/filename.png
 *   2. (legacy)   /api/media?file=uploads/filename.png
 *   3. (stale)    https://storage.googleapis.com/bespokewala-storage/uploads/filename.png
 *                 created by a temporary bad commit — rewritten to proxy URL
 *   4. (bare)     /uploads/filename.png                   — missing /api/media prefix
 *   5. (bare2)    uploads/filename.png                    — no leading slash either
 *   6. (public)   https://images.unsplash.com/...         — kept as-is
 *
 * Safe to import in both server and client components.
 * Contains NO secrets and NO GCS credentials.
 */

const GCS_BUCKET = 'bespokewala-storage';
const GCS_BASE = `https://storage.googleapis.com/${GCS_BUCKET}/`;

// Transparent 1×1 pixel PNG data URI — used as the final image fallback
// when both the original and its thumbnail are unavailable.
export const PLACEHOLDER_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

/**
 * Normalize any image URL to a browser-safe proxy URL.
 *
 * Returns:
 *  - /api/media/<key>  for private GCS images (served by the authenticated proxy)
 *  - the original URL  for public images (Unsplash, etc.)
 *  - ''                for null / undefined / empty / malformed
 */
export function normalizeImageUrl(
  url: string | null | undefined,
  variant?: 'thumbnail' | 'medium' | 'large',
): string {
  if (!url || typeof url !== 'string' || url.trim() === '') return '';

  const trimmed = url.trim();
  let proxyUrl = '';

  // 1. Already a correct proxy URL: /api/media/...
  if (trimmed.startsWith('/api/media/')) {
    proxyUrl = trimmed;
  }
  // 2. Legacy query-param proxy: /api/media?file=uploads/foo.png
  //    → /api/media/uploads/foo.png
  else if (trimmed.startsWith('/api/media?file=')) {
    const key = trimmed.replace('/api/media?file=', '');
    proxyUrl = `/api/media/${key}`;
  }
  // 3. Stale direct GCS CDN URL (private bucket):
  //    https://storage.googleapis.com/bespokewala-storage/uploads/foo.png
  //    → /api/media/uploads/foo.png
  else if (trimmed.startsWith(GCS_BASE)) {
    const gcsKey = trimmed.slice(GCS_BASE.length);
    // Guard: never create /api/media/https://... garbage
    if (gcsKey && !gcsKey.startsWith('http')) {
      proxyUrl = `/api/media/${gcsKey}`;
    }
  }
  // 4. Bare /uploads/ path (missing /api/media prefix) — old jewellery products
  //    /uploads/filename.png → /api/media/uploads/filename.png
  else if (trimmed.startsWith('/uploads/')) {
    proxyUrl = `/api/media${trimmed}`;
  }
  // 5. Bare path without leading slash: uploads/filename.png
  //    → /api/media/uploads/filename.png
  else if (trimmed.startsWith('uploads/')) {
    proxyUrl = `/api/media/${trimmed}`;
  }
  // 6. Public external URL (Unsplash, CDN, etc.) — pass through unchanged
  //    Do NOT append a variant query string to external URLs.
  else if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  // 7. Other relative paths that start with /
  else if (trimmed.startsWith('/')) {
    proxyUrl = trimmed;
  }

  if (!proxyUrl) {
    // Unrecognised / malformed — return empty so callers can show a fallback
    return '';
  }

  // Strip any existing ?v= variant param before re-appending to avoid duplication
  const baseUrl = proxyUrl.includes('?v=')
    ? proxyUrl.slice(0, proxyUrl.indexOf('?v='))
    : proxyUrl;

  if (variant) {
    // Append variant alongside any existing query string
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}v=${variant}`;
  }
  return baseUrl;
}

/**
 * Returns true when the URL must bypass Next.js Image Optimization.
 *
 * The Vercel image optimizer cannot recursively call back into the same
 * serverless deployment (/api/media/...). Pass this as the `unoptimized`
 * prop on every <Image> that may receive a proxy URL.
 *
 * Usage:
 *   <Image src={src} unoptimized={shouldBypassOptimizer(src)} ... />
 *
 * Rule: any URL served by our own application (/api/...) must bypass optimization.
 * External URLs (Unsplash, CDN) can be optimized normally.
 */
export function shouldBypassOptimizer(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith('/api/') || url.includes('/api/media/');
}

/**
 * Build the canonical product image URL for a given context.
 *
 * @param rawUrl   - Raw image path from MongoDB (any legacy or current format)
 * @param size     - 'thumbnail' for product cards/grids, 'medium' for PDP, undefined for original
 * @returns        - Browser-safe /api/media/... URL with variant query if applicable,
 *                   or '' if the URL is empty/invalid
 *
 * Example:
 *   getProductImageUrl('/uploads/file.png', 'thumbnail')
 *   → '/api/media/uploads/file.png?v=thumbnail'
 *
 *   getProductImageUrl('uploads/file.png')
 *   → '/api/media/uploads/file.png'
 */
export function getProductImageUrl(
  rawUrl: string | null | undefined,
  size?: 'thumbnail' | 'medium' | 'large',
): string {
  return normalizeImageUrl(rawUrl, size);
}
