"use client";

import React, { useState, useCallback } from 'react';
import Image, { ImageProps } from 'next/image';
import { normalizeImageUrl, shouldBypassOptimizer } from '@/lib/imageUrl';

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

/** Styled "No Image" placeholder shown when the GCS file is missing. */
function NoImagePlaceholder({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '0.5rem',
        color: '#bbb',
        fontSize: '0.7rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontFamily: 'inherit',
        ...style,
      }}
      aria-hidden="true"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      <span>No Image</span>
    </div>
  );
}

/**
 * A global, reusable Image component that handles:
 * 1. Automatic GCS variant requesting (thumbnail vs medium vs large).
 * 2. Next.js image optimizer recursion prevention.
 * 3. Graceful fallback on load error — shows styled "No Image" placeholder.
 * 4. Default lazy loading for performance.
 *
 * NOTE: No secondary fetch() is performed. The proxy at /api/media/[...path]
 * returns HTTP 410 Gone for missing GCS files, which triggers Next.js <Image>
 * onError correctly — no double-request overhead on listing pages.
 */
export default function OptimizedImage({
  src,
  variant,
  priority = false,
  alt,
  style,
  ...rest
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  // Reset error state whenever src changes (e.g. carousel slide change)
  const prevSrc = React.useRef(src);
  if (prevSrc.current !== src) {
    prevSrc.current = src;
    if (hasError) setHasError(false);
  }

  // No src at all → show placeholder immediately (no network request)
  const resolvedSrc = normalizeImageUrl(src, variant) || normalizeImageUrl(src);
  if (!resolvedSrc) {
    return <NoImagePlaceholder style={style as React.CSSProperties} />;
  }

  // Image failed to load → show placeholder
  if (hasError) {
    return <NoImagePlaceholder style={style as React.CSSProperties} />;
  }

  return (
    <Image
      {...rest}
      src={resolvedSrc}
      alt={alt || 'Bespokewala Image'}
      priority={priority}
      unoptimized={shouldBypassOptimizer(resolvedSrc)}
      onError={handleError}
      style={style}
    />
  );
}
