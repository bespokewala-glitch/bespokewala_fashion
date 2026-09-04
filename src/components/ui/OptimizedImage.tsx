"use client";

import React, { useState, useCallback } from 'react';
import Image, { ImageProps } from 'next/image';
import { 
  normalizeImageUrl, 
  shouldBypassOptimizer, 
  getGcsVariantUrl, 
  generateGcsSrcSet, 
  ImageVariant 
} from '@/lib/imageUrl';

export interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined;
  variant?: ImageVariant;
  priority?: boolean;
  unoptimized?: boolean;
}

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

export default function OptimizedImage({
  src,
  variant,
  priority = false,
  alt,
  style,
  fill,
  sizes,
  unoptimized,
  ...rest
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  
  // Track src changes to reset error state
  const prevSrc = React.useRef(src);
  if (prevSrc.current !== src) {
    prevSrc.current = src;
    if (hasError) setHasError(false);
  }

  const originalUrl = normalizeImageUrl(src);
  
  if (!originalUrl) {
    return <NoImagePlaceholder style={style as React.CSSProperties} />;
  }

  // Determine if we can use direct GCS variants to bypass Next.js optimizer bottleneck
  // We avoid native mode if the user explicitly requested unoptimized=true (since that disables responsive sizes)
  const isGcsImage = originalUrl.includes('storage.googleapis.com');
  const shouldUseNativeGcs = isGcsImage && !hasError && !unoptimized;

  if (shouldUseNativeGcs) {
    // If a specific variant is requested (e.g., thumbnail), use its direct URL.
    // Otherwise, default to 'medium' as the base src for responsive images.
    const directSrc = variant 
      ? getGcsVariantUrl(originalUrl, variant) || originalUrl 
      : getGcsVariantUrl(originalUrl, 'medium') || originalUrl;

    const gcsSrcSet = generateGcsSrcSet(originalUrl);

    // Map Next.js 'fill' prop to native CSS equivalents
    const imgStyle: React.CSSProperties = {
      ...style,
      ...(fill
        ? {
            position: 'absolute',
            height: '100%',
            width: '100%',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            color: 'transparent',
          }
        : {}),
    };

    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        {...rest}
        src={directSrc}
        srcSet={gcsSrcSet}
        sizes={sizes}
        alt={alt || 'Bespokewala Image'}
        style={imgStyle}
        loading={priority ? undefined : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        onError={() => setHasError(true)} // Fallback to Next.js on 404 (e.g. variants not yet generated)
      />
    );
  }

  // Fallback: Use Next.js Image optimizer if the GCS variant 404s, or if it's an external URL (Unsplash)
  return (
    <Image
      {...rest}
      src={originalUrl}
      alt={alt || 'Bespokewala Image'}
      priority={priority}
      fill={fill}
      sizes={sizes}
      unoptimized={shouldBypassOptimizer(originalUrl) || unoptimized}
      style={style}
      onError={() => {
        // Only set error if we are already in the fallback state and it STILL fails
        if (hasError) {
          // This prevents infinite loops, we can't do anything else.
          // Wait, Next.js Image doesn't let us easily replace itself with a div on error without another state.
          // We'll just let the broken image icon show, or we could add a second state.
        }
      }}
    />
  );
}
