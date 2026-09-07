'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';
import OptimizedImage from '@/components/ui/OptimizedImage';
import ProductCardWishlistButton from '@/components/product/ProductCardWishlistButton';

export default function PremiumFeaturedCarousel({ products }: { products: any[] }) {
  const { formatPrice } = useCurrency();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showArrows, setShowArrows] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    setShowArrows(mql.matches);
    const handler = (e: MediaQueryListEvent) => setShowArrows(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
    } else {
      mql.addListener(handler);
    }

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handler);
      } else {
        mql.removeListener(handler);
      }
    };
  }, []);

  // Intersection Observer to detect the currently centered card
  useEffect(() => {
    const root = carouselRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(index)) {
              setActiveIndex(index);
            }
          }
        });
      },
      {
        root: root,
        rootMargin: '0px -49% 0px -49%', // Highly sensitive to the center line
        threshold: 0,
      }
    );

    const cards = root.querySelectorAll('.unified-product-card');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [products]);

  const scrollToIndex = useCallback((index: number) => {
    if (carouselRef.current) {
      const cards = carouselRef.current.querySelectorAll('.unified-product-card');
      const card = cards[index] as HTMLElement;
      if (card) {
        const container = carouselRef.current;
        const containerCenter = container.clientWidth / 2;
        const cardCenter = card.offsetLeft + card.clientWidth / 2;
        container.scrollTo({
          left: cardCenter - containerCenter,
          behavior: 'smooth',
        });
      }
    }
  }, []);

  const activeIndexRef = useRef(activeIndex);
  
  // Keep ref in sync with state
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Auto-swipe functionality
  useEffect(() => {
    if (isHovered || !products || products.length <= 1) return;

    const interval = setInterval(() => {
      // Use the ref so we don't clear and restart the interval on every single scroll step
      const nextIndex = (activeIndexRef.current + 1) % products.length;
      scrollToIndex(nextIndex);
    }, 2500); // Normal, faster transition (2.5s)

    return () => clearInterval(interval);
  }, [isHovered, products, scrollToIndex]);

  const scrollLeft = () => {
    const prevIndex = (activeIndex - 1 + products.length) % products.length;
    scrollToIndex(prevIndex);
  };

  const scrollRight = () => {
    const nextIndex = (activeIndex + 1) % products.length;
    scrollToIndex(nextIndex);
  };

  if (!products || products.length === 0) return null;

  return (
    <div 
      className="unified-carousel-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => {
        // Short delay before resuming auto-swipe after touch
        setTimeout(() => setIsHovered(false), 2000);
      }}
      onTouchCancel={() => {
        setTimeout(() => setIsHovered(false), 2000);
      }}
    >
      <style>{`
        .unified-carousel-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
          padding: 2rem 0;
        }
        @media (max-width: 768px) {
          .unified-carousel-wrapper {
            padding: 1rem 0 1rem 0;
          }
        }

        .unified-product-rail {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
          gap: 1.5rem;
          /* Mobile padding to center the 75vw card */
          padding: 2rem calc(50vw - 37.5vw);
          scroll-behavior: smooth;
        }

        .unified-product-rail::-webkit-scrollbar {
          display: none;
        }

        .unified-product-card {
          scroll-snap-align: center;
          flex: 0 0 75vw;
          max-width: 320px;
          display: flex;
          flex-direction: column;
          text-align: left;
          position: relative;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          opacity: 0.75;
          transform: scale(0.95);
        }
        
        .unified-product-card.is-active {
          opacity: 1;
          transform: scale(1.02);
          z-index: 10;
        }

        .unified-product-image-wrap {
          width: 100%;
          aspect-ratio: 4 / 5;
          position: relative;
          border-radius: 2px;
          overflow: hidden;
          background-color: #F8F6F1;
          transition: transform 0.4s ease;
        }

        @media (min-width: 768px) {
          .unified-product-rail {
            /* Desktop padding to perfectly center a 300px card */
            padding: 2rem calc(50% - 150px);
            gap: 3rem;
          }
          .unified-product-card {
            flex: 0 0 300px;
            opacity: 0.65;
            transform: scale(0.92);
          }
          .unified-product-card.is-active {
            opacity: 1;
            transform: scale(1.05);
          }
          .unified-product-card:hover .unified-product-image-wrap {
            transform: scale(1.02);
          }
        }

        .unified-product-info {
          margin-top: 20px;
          text-align: center;
          padding: 0 10px;
        }

        .unified-product-title {
          font-size: 0.85rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #111;
          margin: 0 0 6px 0;
          line-height: 1.5;
          font-weight: 300;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .unified-product-price {
          font-size: 0.85rem;
          font-weight: 300;
          color: #777;
          margin: 0;
          letter-spacing: 0.05em;
        }

        .unified-nav-btn {
          position: absolute;
          /* Roughly center with the image part of the card (4/5 aspect ratio) */
          top: calc(2rem + 350px / 2); 
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background-color: transparent;
          border: 1px solid rgba(0,0,0,0.1);
          cursor: pointer;
          z-index: 30;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #111;
          transition: all 0.3s ease;
          backdrop-filter: blur(4px);
        }
        
        .unified-nav-btn:hover {
          border-color: rgba(0,0,0,0.4);
          background-color: rgba(255,255,255,0.9);
        }

        .nav-left {
          left: 2rem;
        }

        .nav-right {
          right: 2rem;
        }

        .mobile-swipe-indicator {
          font-size: 10px;
          letter-spacing: 1.5px;
          color: #887a6d;
          text-transform: uppercase;
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        @media (min-width: 768px) {
          .mobile-swipe-indicator {
            display: none;
          }
          .unified-nav-btn {
            top: calc(2rem + 375px / 2); /* Desktop height adjustment */
          }
        }
      `}</style>

      <div className="unified-product-rail" ref={carouselRef}>
        {products.map((product, index) => (
          <Link 
            href={`/products/${product.slug}`} 
            key={product._id} 
            className={`unified-product-card ${index === activeIndex ? 'is-active' : ''}`} 
            data-index={index}
            prefetch={false}
          >
            <div className="unified-product-image-wrap">
              <OptimizedImage 
                src={product.images[0]} 
                alt={`Bespokewala ${product.name}`} 
                fill
                style={{ objectFit: 'cover' }}
                variant="thumbnail"
                sizes="(max-width: 768px) 80vw, 300px"
                loading={index < 4 ? 'eager' : 'lazy'}
                priority={index < 2}
              />
              <ProductCardWishlistButton 
                product={{
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  primaryImage: product.images[0],
                }} 
              />
            </div>
            <div className="unified-product-info">
              <h3 className="unified-product-title">{product.name}</h3>
              <p className="unified-product-price">{formatPrice(product.price)}</p>
            </div>
          </Link>
        ))}
      </div>

      {showArrows && (
        <>
          <button 
            onClick={scrollLeft}
            aria-label="Previous featured product"
            className="unified-nav-btn nav-left"
          >
            <svg width="12" height="20" viewBox="0 0 14 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="10 18 4 12 10 6"></polyline>
            </svg>
          </button>
          <button 
            onClick={scrollRight}
            aria-label="Next featured product"
            className="unified-nav-btn nav-right"
          >
            <svg width="12" height="20" viewBox="0 0 14 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 18 10 12 4 6"></polyline>
            </svg>
          </button>
        </>
      )}

      {!showArrows && (
        <div className="mobile-swipe-indicator">
          SWIPE TO EXPLORE <span>&rarr;</span>
        </div>
      )}
    </div>
  );
}
