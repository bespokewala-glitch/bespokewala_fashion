"use client";

import React, { useEffect, useRef } from 'react';
import ProductCard from '@/components/product/ProductCard';

export default function FeaturedArrivalsCarousel({ products }: { products: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const maxScroll = scrollWidth - clientWidth;
        
        // Approximate width of one card + gap (350px + 32px gap)
        const scrollAmount = 382;

        if (scrollLeft >= maxScroll - 10) {
          // Reset to start if we reached the end
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Scroll to the next item
          scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }
    }, 3000); // Move every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      ref={scrollRef}
      style={{
        display: 'flex',
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        gap: '2rem',
        paddingBottom: '2rem',
        marginTop: '3rem',
        textAlign: 'left',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        scrollBehavior: 'smooth'
      }}
      className="horizontal-scroll-hide-bar"
    >
      <style>{`
        .horizontal-scroll-hide-bar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {products.map((product) => (
        <div 
          key={product._id.toString()} 
          style={{ 
            width: '350px', 
            flex: '0 0 350px', 
            scrollSnapAlign: 'start' 
          }}
        >
          <ProductCard product={product} variant="slider" />
        </div>
      ))}
    </div>
  );
}
