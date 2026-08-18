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
  variant?: 'thumbnail' | 'medium' | 'large';
  
  /**
   * By default, images load lazily. Set to true for above-the-fold hero images.
   */
  priority?: boolean;
}

const gcsLoader = ({ src, width, quality }: import('next/image').ImageLoaderProps) => {
  if (src.startsWith('/api/media/')) {
    // Strip any existing ?v= to recalculate based on width for retina/responsive support
    let baseUrl = src;
    if (src.includes('?v=')) {
      baseUrl = src.slice(0, src.indexOf('?v='));
    } else if (src.includes('?')) {
      baseUrl = src.slice(0, src.indexOf('?'));
    }

    // Generate responsive variants based on Next.js requested width.
    let v = 'large';
    if (width <= 640) v = 'thumbnail';
    else if (width <= 1080) v = 'medium';
    
    return `${baseUrl}?v=${v}&w=${width}&q=${quality || 75}`;
  }
  return src;
};

/**
 * A global, reusable Image component that handles:
 * 1. Automatic GCS variant requesting (thumbnail vs medium vs original).
 * 2. Next.js image optimizer recursion prevention via custom loader.
 * 3. Graceful fallback on error (Target Variant -> Placeholder).
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

  // Update error state if src changes
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
      unoptimized={false}
      loader={isProxyUrl ? gcsLoader : undefined}
      onError={handleError}
    />
  );
}
