"use client";

import React from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';

export default function JewelleryProcess({ data }: { data?: any }) {
  if (!data) return null;

  const { 
    title = "The Jewellery Process", 
    description = "From selecting the finest gemstones to the intricate detailing of the setting, every piece of our high jewellery is a masterclass in craftsmanship. Our artisans spend hundreds of hours perfecting the cut, clarity, and design, ensuring that each creation is as unique as the person wearing it.\n\nExperience the journey of transforming rare materials into breathtaking masterpieces.", 
    image 
  } = data;

  if (!image) return null;

  return (
    <section id="jewellery-process" style={{ backgroundColor: '#faf8f5', padding: '6rem 2rem' }} className="mobile-section-py mobile-px-container">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 300, letterSpacing: '0.1em', marginBottom: '3rem', textTransform: 'uppercase', color: '#111', textAlign: 'center' }} className="mobile-h2-clamp">
          {title}
        </h2>
        
        <div style={{ display: 'flex', gap: '4rem', alignItems: 'center' }} className="process-content-wrapper">
          {description && (
            <div style={{ flex: '1', minWidth: '300px' }}>
              <p style={{ color: '#555', fontSize: '1.1rem', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                {description}
              </p>
            </div>
          )}

          <div style={{ flex: description ? '1.5' : '1', position: 'relative', paddingBottom: description ? '60%' : '56.25%', overflow: 'hidden', backgroundColor: '#eee', borderRadius: '4px' }}>
            {image.match(/\.(mp4|webm|ogg)$/i) ? (
              <video
                src={image}
                autoPlay
                loop
                muted
                playsInline
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <OptimizedImage
                src={image}
                alt={title}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 1200px) 100vw, 800px"
                priority={false}
              />
            )}
          </div>
        </div>
        
        <style>{`
          @media (max-width: 900px) {
            .process-content-wrapper {
              flex-direction: column !important;
              gap: 2.5rem !important;
            }
            .process-content-wrapper > div:first-child {
              text-align: center;
            }
          }
        `}</style>
      </div>
    </section>
  );
}
