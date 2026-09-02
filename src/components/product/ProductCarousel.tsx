'use client';

import React, { useEffect, useRef, useState } from 'react';
import ProductCard from '@/components/product/ProductCard';

interface ProductCarouselProps {
  products: any[];
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-swiping logic
  useEffect(() => {
    if (products.length <= 1) return; // No need to swipe if 1 or 0 products

    const interval = setInterval(() => {
      if (!isHovered && scrollRef.current) {
        const container = scrollRef.current;
        // Scroll by one item's width roughly (e.g., 25% of container on desktop)
        const scrollAmount = container.clientWidth / (window.innerWidth > 768 ? 4 : 2);
        
        // If we reached the end, snap back to start
        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }
    }, 3000); // Swipe every 3 seconds

    return () => clearInterval(interval);
  }, [isHovered, products.length]);

  return (
    <div 
      className="product-carousel-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <style>{`
        .product-carousel-container {
          position: relative;
          width: 100%;
        }
        .product-carousel-scroll {
          display: flex;
          gap: 2rem;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none;  /* IE 10+ */
          padding-bottom: 1rem; /* space for scroll if visible on some devices */
        }
        .product-carousel-scroll::-webkit-scrollbar {
          display: none; /* WebKit */
        }
        .product-carousel-item {
          flex: 0 0 calc(25% - 1.5rem);
          scroll-snap-align: start;
        }
        
        @media (max-width: 1024px) {
          .product-carousel-item {
            flex: 0 0 calc(33.333% - 1.33rem);
          }
        }
        
        @media (max-width: 768px) {
          .product-carousel-scroll {
            gap: 1rem;
          }
          .product-carousel-item {
            flex: 0 0 calc(50% - 0.5rem);
          }
        }
      `}</style>

      <div className="product-carousel-scroll" ref={scrollRef}>
        {products.map((product) => (
          <div key={product._id} className="product-carousel-item">
            <ProductCard
              product={product}
              variant="default"
              priority={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
