"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import OptimizedImage from '@/components/ui/OptimizedImage';

const Lightbox = dynamic(() => import('./Lightbox'), { ssr: false });

interface ProductGalleryProps {
  images: { url: string; alt: string }[];
}

export default function ProductGallery({ images }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  // Track which images have been mounted into the DOM.
  // Initially, only the first image is mounted to prioritize LCP.
  const [mountedImages, setMountedImages] = useState<Set<number>>(new Set([0]));

  // Ensure the explicitly clicked thumbnail is instantly mounted if the timeout hasn't fired
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
      <style>{`
        .gallery-container {
          display: flex;
          gap: 1.5rem;
          flex-direction: row;
        }
        .gallery-thumbnails {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100px;
          flex-shrink: 0;
          opacity: 0;
          transition: opacity 0.5s ease-in;
        }
        .gallery-thumbnails.visible {
          opacity: 1;
        }
        .gallery-thumbnail-btn {
          width: 100px;
          height: 140px;
        }
        @media (max-width: 768px) {
          .gallery-container {
            flex-direction: column-reverse;
          }
          .gallery-thumbnails {
            flex-direction: row;
            width: 100%;
            overflow-x: auto;
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
          .gallery-thumbnails::-webkit-scrollbar {
            display: none; /* Chrome, Safari and Opera */
          }
          .gallery-thumbnail-btn {
            width: 70px;
            height: 98px;
            flex-shrink: 0;
          }
        }
        /* NEW: Skeleton Animation */
        @keyframes gallery-shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .gallery-skeleton {
          background: #f6f7f8;
          background-image: linear-gradient(to right, #f6f7f8 0%, #edeef1 20%, #f6f7f8 40%, #f6f7f8 100%);
          background-repeat: no-repeat;
          background-size: 1000px 100%;
          animation: gallery-shimmer 2s infinite linear forwards;
        }
      `}</style>
      <div className="gallery-container">
        {/* Main Image (Left side) */}
        {/* ADDED aspect-ratio to prevent layout shift and gallery-skeleton for shimmering effect */}
        <div className="gallery-skeleton" style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '12px', backgroundColor: '#fafafa', aspectRatio: '2/3', maxHeight: '85vh' }}>
          {images.map((img, idx) => {
            if (!mountedImages.has(idx)) return null;
            
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
              }}>
                <OptimizedImage
                  src={img.url}
                  alt={img.alt}
                  fill
                  onClick={() => setIsLightboxOpen(true)}
                  priority={idx === 0}
                  fetchPriority={idx === 0 ? "high" : "auto"}
                  variant="medium"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ objectFit: 'cover', cursor: 'zoom-in' }}
                />
              </div>
            );
          })}
        </div>

        {/* Thumbnails (Right side on desktop, Top on mobile) */}
        <div className="gallery-thumbnails visible">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className="gallery-thumbnail-btn"
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
              <div className="gallery-skeleton" style={{ position: 'relative', width: '100%', height: '100%' }}>
                <OptimizedImage
                  src={img.url}
                  alt={img.alt}
                  fill
                  variant="thumbnail"
                  loading={idx < 4 ? "eager" : "lazy"}
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
