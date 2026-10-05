"use client";

import React, { useState } from 'react';
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

/**
 * Shown when the image URL is empty, or ALL load attempts fail.
 * Elegant brand-neutral placeholder — no browser broken-image icon ever shown.
 */
function NoImagePlaceholder({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #f5f0eb 0%, #ede8e2 50%, #f5f0eb 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '0.5rem',
        color: '#c8b8a8',
        fontSize: '0.65rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        fontFamily: 'inherit',
        ...style,
      }}
      aria-hidden="true"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </div>
  );
}

/**
 * Lightweight shimmer shown while image is loading to prevent layout shift.
 */
function LoadingShimmer({ fill, style }: { fill?: boolean; style?: React.CSSProperties }) {
  return (
    <>
      <style>{`
        @keyframes bw-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, #f0ebe5 25%, #e8e1d9 50%, #f0ebe5 75%)',
          backgroundSize: '200% 100%',
          animation: 'bw-shimmer 1.5s infinite',
          ...(fill ? { position: 'absolute' as const, inset: 0 } : {}),
          ...style,
        }}
        aria-hidden="true"
      />
    </>
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
  // errorPhase: 0 = ok, 1 = GCS failed (try Next.js), 2 = all failed (show placeholder)
  const [errorPhase, setErrorPhase] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset state when src changes
  const prevSrc = React.useRef(src);
  if (prevSrc.current !== src) {
    prevSrc.current = src;
    if (errorPhase !== 0) setErrorPhase(0);
    if (isLoaded) setIsLoaded(false);
  }

  const originalUrl = normalizeImageUrl(src);

  if (!originalUrl || errorPhase >= 2) {
    return <NoImagePlaceholder style={style as React.CSSProperties} />;
  }

  // ── GCS Native Path ──────────────────────────────────────────────────────────
  // For GCS images, bypass Next.js optimizer and use pre-generated variant URLs.
  // This avoids recursive Vercel serverless calls.
  const isGcsImage = originalUrl.includes('storage.googleapis.com');
  const useNativeGcs = isGcsImage && errorPhase === 0 && !unoptimized;

  if (useNativeGcs) {
    const directSrc = variant
      ? getGcsVariantUrl(originalUrl, variant) || originalUrl
      : getGcsVariantUrl(originalUrl, 'medium') || originalUrl;

    const gcsSrcSet = generateGcsSrcSet(originalUrl);

    const imgStyle: React.CSSProperties = {
      ...style,
      opacity: isLoaded ? 1 : 0,
      transition: 'opacity 0.3s ease',
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
      <>
        {!isLoaded && <LoadingShimmer fill={fill} />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          {...rest}
          src={directSrc}
          srcSet={gcsSrcSet}
          sizes={sizes}
          alt={alt || 'Bespokewala Image'}
          style={imgStyle}
          loading={priority ? undefined : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            // GCS variant 404 → fall through to Next.js optimizer
            setErrorPhase(1);
            setIsLoaded(false);
          }}
        />
      </>
    );
  }

  // ── Next.js Image Optimizer Path ─────────────────────────────────────────────
  // Used for: external URLs (Unsplash, etc.) or as GCS fallback after a variant 404.
  return (
    <>
      {!isLoaded && <LoadingShimmer fill={fill} />}
      <Image
        {...rest}
        src={originalUrl}
        alt={alt || 'Bespokewala Image'}
        priority={priority}
        fill={fill}
        sizes={sizes}
        unoptimized={shouldBypassOptimizer(originalUrl) || unoptimized}
        style={{ ...style, opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          // Both GCS variant and Next.js optimizer failed — show placeholder
          setErrorPhase(2);
        }}
      />
    </>
  );
}
