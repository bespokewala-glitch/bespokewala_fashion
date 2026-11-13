"use client";

import React, { useRef, useEffect, useState } from 'react';

export interface LazyVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
}

export default function LazyVideo({
  src,
  poster,
  style,
  className,
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  ...rest
}: LazyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isInView && autoPlay && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [isInView, autoPlay]);

  return (
    <video
      ref={videoRef}
      src={isInView ? src : undefined}
      poster={poster}
      autoPlay={isInView && autoPlay}
      loop={loop}
      muted={muted}
      playsInline={playsInline}
      preload="none"
      style={style}
      className={className}
      {...rest}
    />
  );
}

