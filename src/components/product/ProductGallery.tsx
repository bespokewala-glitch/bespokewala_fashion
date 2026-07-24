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
      <div style={{ display: 'flex', gap: '1.5rem', flexDirection: 'row' }}>
        {/* Main Image (Left side) */}
      <div style={{ flex: 1, position: 'relative' }}>
        <img
          src={selectedImage.url}
          alt={selectedImage.alt}
          onClick={() => setIsLightboxOpen(true)}
          style={{
            width: '100%',
            height: '100%',
            maxHeight: '85vh',
            objectFit: 'cover',
            backgroundColor: '#fafafa',
            borderRadius: '12px',
            cursor: 'zoom-in',
          }}
        />
      </div>

      {/* Thumbnails (Right side) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100px', flexShrink: 0 }}>
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedIndex(idx)}
            style={{
              width: '100px',
              height: '140px',
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
