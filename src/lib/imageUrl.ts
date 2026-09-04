/**
 * imageUrl.ts — Shared image URL utilities
 *
 * Architecture:
 *   GCS bucket is PUBLIC.
 *   Product images are served directly from the public GCS URL.
 *   Pre-generated WebP variants (_variants/medium/...) are used to bypass Next.js image optimization bottlenecks.
 */

const GCS_BUCKET = process.env.NEXT_PUBLIC_BUCKET_NAME || 'bespokewala-public-product-images';
const GCS_BASE = `https://storage.googleapis.com/${GCS_BUCKET}/`;

export const PLACEHOLDER_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export type ImageVariant = 'micro' | 'small' | 'thumbnail' | 'medium' | 'large';

/**
 * Normalize any image URL to a browser-safe proxy URL.
 * Returns the direct public GCS URL for images, or the original URL for external images.
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string' || url.trim() === '') return '';

  const trimmed = url.trim();
  let baseKey = '';

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
    return trimmed; 
  } else if (trimmed.startsWith('/')) {
    baseKey = trimmed.slice(1);
  }

  if (!baseKey) return '';
  if (baseKey.includes('?')) baseKey = baseKey.split('?')[0];

  return `${GCS_BASE}${baseKey}`;
}

/**
 * Gets the direct GCS URL for a specific pre-generated WebP variant.
 */
export function getGcsVariantUrl(
  url: string | null | undefined,
  variant: ImageVariant
): string | null {
  const normalized = normalizeImageUrl(url);
  if (!normalized) return null;
  
  if (normalized.startsWith(GCS_BASE)) {
    const key = normalized.slice(GCS_BASE.length);
    if (/\.(jpg|jpeg|png|webp|avif)$/i.test(key)) {
      return `${GCS_BASE}_variants/${variant}/${key}.webp`;
    }
  }
  return null;
}

/**
 * Generates a native HTML srcSet string containing all available WebP variants.
 * This allows the browser to natively select the optimal size without Next.js processing.
 */
export function generateGcsSrcSet(url: string | null | undefined): string | undefined {
  const normalized = normalizeImageUrl(url);
  if (!normalized) return undefined;

  if (normalized.startsWith(GCS_BASE)) {
    const key = normalized.slice(GCS_BASE.length);
    if (/\.(jpg|jpeg|png|webp|avif)$/i.test(key)) {
      return `
        ${GCS_BASE}_variants/small/${key}.webp 300w,
        ${GCS_BASE}_variants/thumbnail/${key}.webp 600w,
        ${GCS_BASE}_variants/medium/${key}.webp 1000w,
        ${GCS_BASE}_variants/large/${key}.webp 1600w
      `.trim();
    }
  }
  return undefined;
}

export function shouldBypassOptimizer(url: string | null | undefined): boolean {
  return false; 
}

export function getProductImageUrl(
  rawUrl: string | null | undefined,
  size?: ImageVariant,
): string {
  // If size requested, try to return variant URL first
  if (size) {
    const variantUrl = getGcsVariantUrl(rawUrl, size);
    if (variantUrl) return variantUrl;
  }
  return normalizeImageUrl(rawUrl);
}
