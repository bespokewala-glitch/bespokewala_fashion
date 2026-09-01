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
      <style>{`
        .footwear-gallery-container {
          display: flex;
          gap: 1.5rem;
          flex-direction: row;
        }
        .footwear-gallery-thumbnails {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100px;
          flex-shrink: 0;
          opacity: 0;
          transition: opacity 0.5s ease-in;
        }
        .footwear-gallery-thumbnails.visible {
          opacity: 1;
        }
        .footwear-thumbnail-btn {
          width: 100px;
          height: 140px;
        }
        @media (max-width: 768px) {
          .footwear-gallery-container {
            flex-direction: column-reverse;
          }
          .footwear-gallery-thumbnails {
            flex-direction: row;
            width: 100%;
            overflow-x: auto;
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .footwear-gallery-thumbnails::-webkit-scrollbar {
            display: none;
          }
          .footwear-thumbnail-btn {
            width: 70px;
            height: 98px;
            flex-shrink: 0;
          }
        }
        
        @keyframes footwear-shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .footwear-skeleton {
          background: #f6f7f8;
          background-image: linear-gradient(to right, #f6f7f8 0%, #edeef1 20%, #f6f7f8 40%, #f6f7f8 100%);
          background-repeat: no-repeat;
          background-size: 1000px 100%;
          animation: footwear-shimmer 2s infinite linear forwards;
        }
      `}</style>
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
