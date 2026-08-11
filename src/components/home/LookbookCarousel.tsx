"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { shouldBypassOptimizer } from '@/lib/imageUrl';

export default function LookbookCarousel({ data }: { data?: any }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const defaultMuses = [
    { name: 'Ranveer Singh', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80' },
    { name: 'Alia Bhatt', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80' },
    { name: 'Shahrukh Khan', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80' },
  ];

  const subtitle = data?.subtitle || "Where dreams are draped in couture and stars become muse.";
  const muses = (data?.items && data.items.length > 0) ? data.items.map((i: any) => ({
    name: i.name || '',
    img: i.image || ''
  })) : defaultMuses;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section style={{ padding: '6rem 2rem', backgroundColor: '#fafafa', textAlign: 'center', position: 'relative' }}>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '4rem', fontStyle: 'italic' }}>
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
              <Image
                src={muse.img}
                alt={muse.name}
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                style={{ objectFit: 'cover' }}
                unoptimized={shouldBypassOptimizer(muse.img)}
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
