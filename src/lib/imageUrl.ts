/**
 * imageUrl.ts — Shared image URL utilities
 *
 * Architecture:
 *   GCS bucket is PUBLIC.
 *   All product images are served directly from the public GCS URL.
 *   Next.js Image Optimizer natively handles resizing and caching.
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

const GCS_BUCKET = process.env.NEXT_PUBLIC_BUCKET_NAME || 'bespokewala-public-product-images';
const GCS_BASE = `https://storage.googleapis.com/${GCS_BUCKET}/`;

// Transparent 1×1 pixel PNG data URI — used as the final image fallback
// when both the original and its thumbnail are unavailable.
export const PLACEHOLDER_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

/**
 * Normalize any image URL to a browser-safe proxy URL.
 *
 * Returns:
 *  - The direct public GCS URL for images
 *  - the original URL for public images (Unsplash, etc.)
 *  - '' for null / undefined / empty / malformed
 */
export function normalizeImageUrl(
  url: string | null | undefined,
  variant?: 'micro' | 'thumbnail' | 'medium' | 'large',
): string {
  if (!url || typeof url !== 'string' || url.trim() === '') return '';

  const trimmed = url.trim();
  let baseKey = '';

  // Extract the raw GCS key from various formats
  if (trimmed.startsWith('/api/media/')) {
    baseKey = trimmed.replace('/api/media/', '');
  } else if (trimmed.startsWith('/api/media?file=')) {
    baseKey = trimmed.replace('/api/media?file=', '');
  } else if (trimmed.startsWith(GCS_BASE)) {
    baseKey = trimmed.slice(GCS_BASE.length);
  } else if (trimmed.startsWith('https://storage.googleapis.com/bespokewala-storage/')) {
    baseKey = trimmed.replace('https://storage.googleapis.com/bespokewala-storage/', '');
  } else if (trimmed.startsWith('/uploads/')) {
    baseKey = trimmed.slice(1);
  } else if (trimmed.startsWith('uploads/')) {
    baseKey = trimmed;
  } else if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed; // Public external URL
  } else if (trimmed.startsWith('/')) {
    baseKey = trimmed.slice(1);
  }

  if (!baseKey) return '';

  // Strip query strings if present
  if (baseKey.includes('?')) {
    baseKey = baseKey.split('?')[0];
  }

  // With a public bucket, we no longer need to proxy through /api/media.
  // Next.js <Image> will optimize this public URL directly and apply its own sizing and variants natively.
  return `${GCS_BASE}${baseKey}`;
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
 */
export function shouldBypassOptimizer(url: string | null | undefined): boolean {
  return false; // Let Next.js optimize the public GCS URLs natively
}

/**
 * Build the canonical product image URL for a given context.
 *
 * @param rawUrl   - Raw image path from MongoDB (any legacy or current format)
 * @param size     - 'thumbnail' for product cards/grids, 'medium' for PDP, undefined for original
 * @returns        - Browser-safe public GCS URL
 *                   or '' if the URL is empty/invalid
 *
 * Example:
 *   getProductImageUrl('uploads/file.png')
 *   → 'https://storage.googleapis.com/bucket-name/uploads/file.png'
 */
export function getProductImageUrl(
  rawUrl: string | null | undefined,
  size?: 'micro' | 'thumbnail' | 'medium' | 'large',
): string {
  return normalizeImageUrl(rawUrl, size);
}
