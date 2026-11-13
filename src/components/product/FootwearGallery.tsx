"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import OptimizedImage from '@/components/ui/OptimizedImage';

const Lightbox = dynamic(() => import('./Lightbox'), { ssr: false });

interface ProductGalleryProps {
  images: { url: string; alt: string }[];
}

export default function FootwearGallery({ images }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  // Track which images have been mounted into the DOM.
  // We only mount the first image initially. Others mount ONLY when clicked.
  const [mountedImages, setMountedImages] = useState<Set<number>>(new Set([0]));
  
  // Track if the main LCP image has loaded so we can delay thumbnails.
  const [mainImageLoaded, setMainImageLoaded] = useState(false);

  // When a thumbnail is clicked, mount its corresponding main image
  useEffect(() => {
    setMountedImages(prev => {
      if (prev.has(selectedIndex)) return prev;
      const next = new Set(prev);
      next.add(selectedIndex);
      return next;
    });
  }, [selectedIndex]);

  if (!images || images.length === 0) {
    return <div style={{ width: '100%', aspectRatio: '2/3', backgroundColor: '#f0f0f0', borderRadius: '12px' }} />;
  }

  return (
    <>
      <div className="footwear-gallery-container">
        {/* Main Image (Left side) */}
        <div className="footwear-skeleton" style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '12px', backgroundColor: '#fafafa', aspectRatio: '2/3', maxHeight: '85vh' }}>
          {images.map((img, idx) => {
            if (!mountedImages.has(idx)) return null;
            
            // Check if it's a proxy URL that supports ?v=thumbnail
            const isProxy = img.url.includes('/api/media/');
            // The image might already have query params
            const thumbnailUrl = isProxy ? `${img.url}${img.url.includes('?') ? '&' : '?'}v=thumbnail` : img.url;

            return (
              <div key={idx} style={{
                  width: '100%',
                  height: '100%',
                  position: idx === 0 ? 'relative' : 'absolute',
                  top: 0,
                  left: 0,
                  opacity: selectedIndex === idx ? 1 : 0,
                  transition: 'opacity 0.4s ease-in-out',
                  zIndex: selectedIndex === idx ? 2 : 1,
                  // Use the already-loaded thumbnail as a background placeholder for instant switching
                  backgroundImage: idx !== 0 ? `url(${thumbnailUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
              }}>
                <OptimizedImage
                  src={img.url}
                  alt={img.alt}
                  fill
                  onClick={() => setIsLightboxOpen(true)}
                  priority={idx === 0}
                  fetchPriority={idx === 0 ? "high" : "auto"}
                  variant="medium"
                  onLoad={() => {
                    if (idx === 0) setMainImageLoaded(true);
                  }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: 'cover', cursor: 'zoom-in' }}
                />
              </div>
            );
          })}
        </div>

        {/* Thumbnails (Right side) - Only load progressively after main image */}
        <div className={`footwear-gallery-thumbnails ${mainImageLoaded ? 'visible' : ''}`}>
          {mainImageLoaded && images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className="footwear-thumbnail-btn"
              style={{
                padding: 0,
                border: selectedIndex === idx ? '2px solid #d4af37' : '2px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
              aria-label={`View ${img.alt}`}
            >
              <div className="footwear-skeleton" style={{ position: 'relative', width: '100%', height: '100%' }}>
                <OptimizedImage
                  src={img.url}
                  alt={img.alt}
                  fill
                  variant="micro"
                  unoptimized={true}
                  loading="lazy"
                  sizes="100px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <Lightbox 
        images={images} 
        initialIndex={selectedIndex} 
        isOpen={isLightboxOpen} 
        onClose={() => setIsLightboxOpen(false)} 
      />
    </>
  );
}
