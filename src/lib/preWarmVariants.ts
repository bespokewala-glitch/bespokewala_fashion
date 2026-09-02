/**
 * preWarmVariants.ts — Server-side image variant pre-warming utility
 *
 * Generates all 4 size variants (micro, thumbnail, medium, large) for a given
 * GCS image key and saves them back to GCS. Safe to call fire-and-forget.
 *
 * Usage:
 *   import { preWarmGcsKey } from '@/lib/preWarmVariants';
 *   // After upload or product save:
 *   preWarmGcsKey('/api/media/uploads/filename.png').catch(() => {});
 *
 * SERVER-ONLY — never import this from client components.
 */

import { bucket } from '@/lib/gcs';

const VARIANTS = [
  { name: 'micro',     width: 120,  quality: 70 },
  { name: 'thumbnail', width: 600,  quality: 80 },
  { name: 'medium',    width: 1000, quality: 85 },
  { name: 'large',     width: 1600, quality: 85 },
] as const;

/**
 * Extract the GCS key from any URL format we use.
 * Returns null for external URLs (Unsplash, etc.) which should not go through GCS.
 */
function extractGcsKey(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // /api/media/uploads/filename.png  →  uploads/filename.png
  if (trimmed.startsWith('/api/media/')) {
    return trimmed.slice('/api/media/'.length).split('?')[0];
  }
  // /uploads/filename.png (bare path with leading slash)
  if (trimmed.startsWith('/uploads/')) {
    return trimmed.slice(1).split('?')[0];
  }
  // uploads/filename.png (no leading slash)
  if (trimmed.startsWith('uploads/')) {
    return trimmed.split('?')[0];
  }
  // GCS CDN URL: https://storage.googleapis.com/bucket/uploads/...
  const GCS_PREFIX = 'https://storage.googleapis.com/bespokewala-storage/';
  if (trimmed.startsWith(GCS_PREFIX)) {
    return trimmed.slice(GCS_PREFIX.length).split('?')[0];
  }

  // External URL (Unsplash, etc.) — skip silently
  return null;
}

/**
 * Generate and save a single variant to GCS.
 * Skips if the variant already exists.
 */
async function generateVariant(
  originalBuffer: Buffer,
  gcsKey: string,
  variantName: string,
  width: number,
  quality: number,
): Promise<string | null> {
  const variantPath = `_variants/${variantName}/${gcsKey}.webp`;

  // Fast-path: skip if variant already exists in GCS
  try {
    const [exists] = await bucket.file(variantPath).exists();
    if (exists) return variantPath;
  } catch {
    // If exists() fails, attempt generation anyway
  }

  try {
    const sharp = (await import('sharp')).default;
    sharp.concurrency(1);
    const optimized = await sharp(originalBuffer)
      .resize(width, null, { withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();

    await bucket.file(variantPath).save(optimized, {
      contentType: 'image/webp',
      metadata: { cacheControl: 'public, max-age=31536000, immutable' },
    });

    console.log(`[preWarm] ✅ ${variantPath} (${optimized.length} bytes)`);
    return variantPath;
  } catch (err) {
    console.error(
      `[preWarm] ⚠️  Failed to generate "${variantPath}":`,
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

/**
 * Pre-warm all 4 variants for an image URL.
 *
 * @param url  - Any URL format (proxy /api/media/, bare path, GCS CDN)
 * @returns    - Array of generated variant paths (null = skipped or failed)
 */
export async function preWarmGcsKey(url: string | null | undefined): Promise<(string | null)[]> {
  const gcsKey = extractGcsKey(url);
  if (!gcsKey) return []; // External URL or invalid

  if (!/\.(jpg|jpeg|png|webp|avif)$/i.test(gcsKey)) return []; // Skip non-images

  // Download original once — reuse buffer for all variants
  let originalBuffer: Buffer;
  try {
    const gcsFile = bucket.file(gcsKey);
    const [exists] = await gcsFile.exists();
    if (!exists) {
      console.warn(`[preWarm] ❌ Not found in GCS: "${gcsKey}"`);
      return [];
    }
    [originalBuffer] = await gcsFile.download() as [Buffer];
  } catch (err) {
    console.error(
      `[preWarm] ❌ Download failed for "${gcsKey}":`,
      err instanceof Error ? err.message : String(err),
    );
    return [];
  }

  // Generate all variants in parallel
  const results = await Promise.allSettled(
    VARIANTS.map(v => generateVariant(originalBuffer, gcsKey, v.name, v.width, v.quality)),
  );

  return results.map(r => (r.status === 'fulfilled' ? r.value : null));
}

/**
 * Pre-warm variants for multiple image URLs at once.
 * Safe to call fire-and-forget.
 */
export async function preWarmMany(urls: (string | null | undefined)[]): Promise<void> {
  const filtered = (urls ?? []).filter(Boolean) as string[];
  if (filtered.length === 0) return;
  await Promise.allSettled(filtered.map(url => preWarmGcsKey(url)));
}
