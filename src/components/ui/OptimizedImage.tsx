"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image, { ImageProps } from 'next/image';
import {
  normalizeImageUrl,
  shouldBypassOptimizer,
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
          pointerEvents: 'none',
          zIndex: 1,
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
  alt = 'Bespokewala Image',
  style,
  fill,
  sizes,
  unoptimized,
  onLoad,
  onError,
  ...rest
}: OptimizedImageProps) {
  // errorPhase: 0 = try target variant, 1 = try original without variant, 2 = all failed
  const [errorPhase, setErrorPhase] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset state when src or variant changes
  const prevSrc = useRef(src);
  const prevVariant = useRef(variant);
  if (prevSrc.current !== src || prevVariant.current !== variant) {
    prevSrc.current = src;
    prevVariant.current = variant;
    if (errorPhase !== 0) setErrorPhase(0);
    if (isLoaded) setIsLoaded(false);
  }

  const targetUrl = normalizeImageUrl(src, variant);
  const originalUrl = normalizeImageUrl(src);

  const currentUrl = errorPhase === 1 ? (originalUrl || '') : (targetUrl || '');
  const isBypass = shouldBypassOptimizer(currentUrl) || unoptimized;

  // Immediate check if browser already has the image cached
  // NOTE: useEffect must come before any early returns to satisfy Rules of Hooks
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [currentUrl]);

  // All hooks are called above — now safe to return early
  if (!targetUrl || errorPhase >= 2) {
    return <NoImagePlaceholder style={style as React.CSSProperties} />;
  }

  return (
    <>
      {!isLoaded && <LoadingShimmer fill={fill} />}
      <Image
        {...rest}
        ref={imgRef}
        src={currentUrl}
        alt={alt || 'Bespokewala Image'}
        priority={priority}
        fill={fill}
        sizes={sizes}
        unoptimized={isBypass}
        style={{
          ...style,
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.25s ease-in-out',
        }}
        onLoad={(e) => {
          setIsLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          if (errorPhase === 0 && targetUrl !== originalUrl) {
            // Variant failed to load — fallback to original file
            setErrorPhase(1);
            setIsLoaded(false);
          } else {
            // Both failed — show placeholder
            setErrorPhase(2);
            setIsLoaded(false);
            onError?.(e);
          }
        }}
      />
    </>
  );
}
