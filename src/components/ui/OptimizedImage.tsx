"use client";

import React, { useState, useCallback } from 'react';
import Image, { ImageProps } from 'next/image';
import { normalizeImageUrl, shouldBypassOptimizer, PLACEHOLDER_IMAGE } from '@/lib/imageUrl';

export interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  /**
   * The raw image URL from the database or CMS.
   */
  src: string | null | undefined;

  /**
   * The variant of the image to request from the server.
   * 'thumbnail' (~600px) is best for grids and cards.
   * 'medium' (~1000px) is best for heroes, banners, and PDP main image.
   * undefined (original) should only be used if absolute maximum quality is required.
   */
  variant?: 'micro' | 'thumbnail' | 'medium' | 'large';

  /**
   * By default, images load lazily. Set to true for above-the-fold hero images.
   */
  priority?: boolean;
}

/**
 * Custom loader for GCS proxy URLs (/api/media/...).
 *
 * KEY FIX: We do NOT append ?w= or ?q= to the URL.
 * The /api/media handler uses Sharp with fixed variant widths (600/1000/1600px).
 * Appending Next.js's own w= param created URLs like ?v=large&w=1920&q=75
 * which were being sent to the GCS path-based variant lookup, causing 404s
 * because no variant file named with those extra params existed.
 *
 * Variant selection based on the requested width:
 *   ≤ 750px  → thumbnail (600px WebP) — covers all mobile product cards/grids
 *   ≤ 1200px → medium   (1000px WebP) — covers tablets and mid-size banners
 *   > 1200px → large    (1600px WebP) — only for full-bleed desktop heroes
 */
const gcsLoader = ({ src, width }: import('next/image').ImageLoaderProps) => {
  if (src.startsWith('/api/media/')) {
    // Strip any existing variant param to avoid duplication
    let baseUrl = src;
    if (src.includes('?')) {
      baseUrl = src.slice(0, src.indexOf('?'));
    }

    // Map the Next.js requested display width to our 3-tier variant system.
    // These thresholds are deliberately conservative so mobile never gets
    // a variant larger than necessary.
    let v = 'large';
    if (width <= 400) v = 'small';
    else if (width <= 750) v = 'thumbnail';
    else if (width <= 1200) v = 'medium';

    // IMPORTANT: We must include the requested Next.js width in the URL as a query param
    // (even though our API route ignores it) so that Next.js doesn't complain about
    // a missing width parameter, and so the browser correctly caches different srcset entries.
    return `${baseUrl}?v=${v}&w=${width}`;
  }
  // External URLs (Unsplash, public CDN) — return as-is
  return src;
};

/**
 * A global, reusable Image component that handles:
 * 1. Automatic GCS variant requesting (thumbnail vs medium vs large).
 * 2. Next.js image optimizer recursion prevention via custom loader.
 * 3. Graceful fallback on error (Target Variant → Placeholder).
 * 4. Default lazy loading for performance.
 */
export default function OptimizedImage({
  src,
  variant,
  priority = false,
  alt,
  ...rest
}: OptimizedImageProps) {
  // 1. Resolve URLs
  const targetSrc = normalizeImageUrl(src, variant);
  const originalSrc = normalizeImageUrl(src);
  const resolvedSrc = targetSrc || originalSrc || PLACEHOLDER_IMAGE;

  // 2. Track error state
  const [hasError, setHasError] = useState(false);

  // 3. Fallback logic
  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  // Reset error state if src changes (e.g. carousel slide change)
  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  const currentSrc = hasError ? PLACEHOLDER_IMAGE : resolvedSrc;

  if (!currentSrc) {
    return <div style={{ width: '100%', height: '100%', backgroundColor: '#f5f5f5' }} aria-hidden="true" />;
  }

  // Determine if it's a proxy URL that should use our custom GCS loader
  const isProxyUrl = shouldBypassOptimizer(currentSrc);

  return (
    <Image
      {...rest}
      src={currentSrc}
      alt={alt || "Bespokewala Image"}
      priority={priority}
      unoptimized={rest.unoptimized || false}
      loader={isProxyUrl ? gcsLoader : undefined}
      onError={handleError}
    />
  );
}
