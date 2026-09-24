"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';

export default function LookbookCarousel({ data }: { data?: any }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Non-celebrity fashion / textile imagery used when no authorised CMS images are available.
  // These are royalty-free Unsplash photos — no real persons are depicted as Bespokewala muses.
  const defaultMuses = [
    { name: 'Bridal Couture', img: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80' },
    { name: 'Festive Elegance', img: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80' },
    { name: 'Heritage Weaves', img: 'https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&q=80' },
  ];

  const subtitle = data?.subtitle || "Where timeless Indian craft meets contemporary luxury.";

  // Filter out any CMS items that use AI-generated images (ChatGPT_Image filenames)
  // to avoid presenting AI-generated likenesses of real public figures as endorsements.
  const rawItems: { name: string; img: string }[] = (data?.items && data.items.length > 0)
    ? data.items.map((i: any) => ({ name: i.name || '', img: i.image || '' }))
    : [];

  const authorisedItems = rawItems.filter(
    (item) => item.img && !item.img.toLowerCase().includes('chatgpt_image')
  );

  const muses = authorisedItems.length > 0 ? authorisedItems : defaultMuses;


  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="lookbook-carousel-section" style={{ backgroundColor: '#fafafa', textAlign: 'center', position: 'relative' }}>
      <style>{`
        .lookbook-carousel-section {
          padding: 6rem 2rem 1rem;
        }
        .lookbook-subtitle {
          margin-bottom: 4rem;
        }
        @media (max-width: 768px) {
          .lookbook-carousel-section {
            padding: 1rem 1rem 0 1rem;
          }
          .lookbook-subtitle {
            margin-bottom: 2rem !important;
          }
        }
      `}</style>
      <p className="lookbook-subtitle" style={{ color: '#666', fontSize: '0.9rem', fontStyle: 'italic' }}>
        {subtitle}
      </p>

      {/* Navigation Arrows */}
      <button
        onClick={() => scroll('left')}
        style={{
          position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)',
          zIndex: 10, background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%',
          width: '40px', height: '40px', cursor: 'pointer', fontSize: '1.2rem',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}
        aria-label="Previous"
      >
        &#10094;
      </button>

      <button
        onClick={() => scroll('right')}
        style={{
          position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)',
          zIndex: 10, background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%',
          width: '40px', height: '40px', cursor: 'pointer', fontSize: '1.2rem',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}
        aria-label="Next"
      >
        &#10095;
      </button>

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          gap: '2rem',
          paddingBottom: '2rem',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE
        }}
      >
        {muses.map((muse: { name: string; img: string }, index: number) => (
          <div key={index} style={{
            flex: '0 0 auto',
            width: '300px',
            scrollSnapAlign: 'start',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{
              width: '100%',
              height: '400px',
              borderRadius: '20px',
              overflow: 'hidden',
              marginBottom: '1.5rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
              position: 'relative'
            }}>
              <OptimizedImage
                src={muse.img}
                alt={muse.name}
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                style={{ objectFit: 'cover' }}
                variant="medium"
              />
            </div>
            <h3 style={{ fontSize: '1rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#333', margin: 0 }}>
              {muse.name}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
}
