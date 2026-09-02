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

// We no longer need the custom gcsLoader because imageUrl.ts now returns
// direct public GCS URLs that point exactly to the pre-warmed variants.

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

  // Since imageUrl.ts now gives us the exact public GCS URL of the variant
  // (e.g. storage.googleapis.com/.../_variants/thumbnail/...), we bypass Next.js
  // Image Optimization entirely to save on Vercel limits and latency.
  return (
    <Image
      {...rest}
      src={currentSrc}
      alt={alt || "Bespokewala Image"}
      priority={priority}
      unoptimized={shouldBypassOptimizer(currentSrc)}
      onError={handleError}
    />
  );
}
