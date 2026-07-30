"use client";

import React, { useState } from 'react';
import Lightbox from './Lightbox';

interface ProductGalleryProps {
  images: { url: string; alt: string }[];
}

export default function ProductGallery({ images }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return <div style={{ width: '100%', aspectRatio: '2/3', backgroundColor: '#f0f0f0', borderRadius: '12px' }} />;
  }

  const selectedImage = images[selectedIndex];

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
      `}</style>
      <div className="gallery-container">
        {/* Main Image (Left side) */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '12px', backgroundColor: '#fafafa' }}>
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img.url}
            alt={img.alt}
            onClick={() => setIsLightboxOpen(true)}
            loading={idx === 0 ? "eager" : "lazy"}
            decoding="async"
            style={{
              width: '100%',
              height: '100%',
              maxHeight: '85vh',
              objectFit: 'cover',
              cursor: 'zoom-in',
              position: idx === 0 ? 'relative' : 'absolute',
              top: 0,
              left: 0,
              opacity: selectedIndex === idx ? 1 : 0,
              transition: 'opacity 0.4s ease-in-out',
              zIndex: selectedIndex === idx ? 2 : 1,
            }}
          />
        ))}
      </div>

      {/* Thumbnails (Right side) */}
      <div className="gallery-thumbnails">
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
            <img
              src={img.url}
              alt={img.alt}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
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
