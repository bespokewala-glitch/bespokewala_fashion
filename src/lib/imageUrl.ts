/**
 * imageUrl.ts — Shared image URL utilities
 *
 * Architecture:
 *   GCS bucket is PRIVATE.
 *   All product/admin images are served through the authenticated proxy:
 *     /api/media/<gcs-key>
 *   The server authenticates to GCS using service-account credentials,
 *   dynamically generates WebP variants via Sharp, caches them into GCS,
 *   and streams them with long-term CDN immutable cache headers.
 *   The browser NEVER calls storage.googleapis.com directly.
 */

export const PLACEHOLDER_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export type ImageVariant = 'micro' | 'small' | 'thumbnail' | 'medium' | 'large';

/**
 * Normalize any image URL to a browser-safe proxy URL.
 * Returns:
 *  - /api/media/<key>[?v=<variant>] for GCS images
 *  - unchanged URL for external images (Unsplash, external CDNs)
 *  - relative asset path as-is (e.g., /bespoken-transparent.png)
 *  - '' for null / undefined / empty
 */
export function normalizeImageUrl(
  url: string | null | undefined,
  variant?: ImageVariant,
): string {
  if (!url || typeof url !== 'string' || url.trim() === '') return '';

  const trimmed = url.trim();
  let proxyUrl = '';
  let extractedVariant: ImageVariant | undefined = undefined;

  // 1. Already a proxy URL: /api/media/...
  if (trimmed.startsWith('/api/media/')) {
    proxyUrl = trimmed;
  }
  // 2. Legacy query-param proxy: /api/media?file=uploads/foo.png
  else if (trimmed.startsWith('/api/media?file=')) {
    const key = trimmed.replace('/api/media?file=', '');
    proxyUrl = `/api/media/${key}`;
  }
  // 3. Direct GCS URL (e.g. https://storage.googleapis.com/<bucket>/...)
  else if (trimmed.includes('storage.googleapis.com/')) {
    const match = trimmed.match(/storage\.googleapis\.com\/[^/]+\/(.+)/);
    if (match && match[1]) {
      let key = match[1];
      // Check if it's pointing to _variants/<variant>/<originalKey>.webp
      if (key.startsWith('_variants/')) {
        const parts = key.split('/');
        if (parts.length >= 3) {
          extractedVariant = parts[1] as ImageVariant;
          const raw = parts.slice(2).join('/').replace(/\.webp$/i, '');
          proxyUrl = `/api/media/${raw}`;
        } else {
          proxyUrl = `/api/media/${key}`;
        }
      } else {
        proxyUrl = `/api/media/${key}`;
      }
    }
  }
  // 4. Bare /uploads/ path
  else if (trimmed.startsWith('/uploads/')) {
    proxyUrl = `/api/media${trimmed}`;
  }
  // 5. Bare uploads/ path without leading slash
  else if (trimmed.startsWith('uploads/')) {
    proxyUrl = `/api/media/${trimmed}`;
  }
  // 6. External public URLs (Unsplash, external CDNs) — pass through unchanged
  else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  // 7. Relative root path (e.g. /bespoken-transparent.png or /hero.png)
  else if (trimmed.startsWith('/')) {
    proxyUrl = trimmed;
  } else {
    proxyUrl = `/api/media/${trimmed}`;
  }

  if (!proxyUrl) return '';

  // If this is an internal /api/media/ proxy URL, handle variant parameter
  if (proxyUrl.startsWith('/api/media/')) {
    const [base, query] = proxyUrl.split('?');
    const params = new URLSearchParams(query || '');

    const effectiveVariant = variant || extractedVariant || (params.get('v') as ImageVariant) || undefined;
    if (effectiveVariant) {
      params.set('v', effectiveVariant);
    }

    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  return proxyUrl;
}

/**
 * Returns true when Next.js image optimization should be bypassed (unoptimized=true).
 *
 * All /api/media/... URLs MUST bypass Next.js image optimization because the Vercel
 * image optimizer cannot recursively call back into the same serverless deployment.
 */
export function shouldBypassOptimizer(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();

  // Any internal proxy route or uploads path must bypass optimizer
  if (trimmed.startsWith('/api/media/') || trimmed.startsWith('/api/') || trimmed.startsWith('/uploads/')) {
    return true;
  }

  // Local static files in public/ (e.g. /bespoken-transparent.png) can be handled normally
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false;
  }

  // Remote hosts allowed in next.config.ts remotePatterns
  const ALLOWED_REMOTE_HOSTS = ['images.unsplash.com'];

  try {
    const { hostname } = new URL(trimmed);
    if (ALLOWED_REMOTE_HOSTS.includes(hostname)) return false;
  } catch {
    return true;
  }

  return true;
}

/**
 * Builds the canonical image URL for a given context.
 */
export function getProductImageUrl(
  rawUrl: string | null | undefined,
  size?: ImageVariant,
): string {
  return normalizeImageUrl(rawUrl, size);
}

/**
 * Gets variant URL for a specific image.
 */
export function getGcsVariantUrl(
  url: string | null | undefined,
  variant: ImageVariant,
): string | null {
  const normalized = normalizeImageUrl(url, variant);
  return normalized || null;
}

/**
 * Generates an HTML srcSet string for responsive loading through /api/media.
 */
export function generateGcsSrcSet(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const normalized = normalizeImageUrl(url);
  if (!normalized || !normalized.startsWith('/api/media/')) return undefined;

  const base = normalized.split('?')[0];
  return `
    ${base}?v=small 300w,
    ${base}?v=thumbnail 600w,
    ${base}?v=medium 1000w,
    ${base}?v=large 1600w
  `.trim();
}
