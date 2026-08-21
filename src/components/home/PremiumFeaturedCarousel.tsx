'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';
import OptimizedImage from '@/components/ui/OptimizedImage';
import ProductCardWishlistButton from '@/components/product/ProductCardWishlistButton';

export default function PremiumFeaturedCarousel({ products }: { products: any[] }) {
  const { formatPrice } = useCurrency();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showArrows, setShowArrows] = useState(false);

  useEffect(() => {
    // Only show arrows on desktop where hover is a thing and screens are wider
    const mql = window.matchMedia('(min-width: 768px)');
    setShowArrows(mql.matches);
    const handler = (e: MediaQueryListEvent) => setShowArrows(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    } else {
      mql.addListener(handler);
      return () => mql.removeListener(handler);
    }
  }, []);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="unified-carousel-wrapper">
      <style>{`
        .unified-carousel-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden; /* Prevents page-level horizontal overflow */
          padding: 2rem 0;
        }

        .unified-product-rail {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
          gap: 1.5rem;
          padding: 0 2rem 2rem 2rem;
          scroll-behavior: smooth;
        }

        .unified-product-rail::-webkit-scrollbar {
          display: none;
        }

        .unified-product-card {
          scroll-snap-align: start;
          flex: 0 0 72vw; /* Mobile width */
          max-width: 280px; /* Max width for desktop */
          display: flex;
          flex-direction: column;
          text-align: left;
          position: relative;
        }
        
        /* Hack to ensure the last item has right margin in flex scroll container */
        .unified-product-rail::after {
          content: '';
          flex: 0 0 1px;
        }

        .unified-product-image-wrap {
          width: 100%;
          aspect-ratio: 4 / 5;
          position: relative;
          border-radius: 4px;
          overflow: hidden;
          background-color: #F8F6F1;
          border: 1px solid rgba(80,70,60,0.08);
          transition: transform 0.3s ease;
        }

        @media (min-width: 768px) {
          .unified-product-card:hover .unified-product-image-wrap {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.05);
          }
        }

        .unified-product-info {
          margin-top: 16px;
          padding-right: 10px;
        }

        .unified-product-title {
          font-size: 13px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #111;
          margin: 0 0 6px 0;
          line-height: 1.4;
          font-weight: 500;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .unified-product-price {
          font-size: 13px;
          font-weight: 400;
          color: #555;
          margin: 0;
        }

        .unified-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: #fff;
          border: 1px solid #eee;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          cursor: pointer;
          z-index: 30;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          color: #111;
          transition: all 0.2s ease;
        }
        
        .unified-nav-btn:hover {
          background-color: #111;
          color: #fff;
        }

        .nav-left {
          left: 1rem;
        }

        .nav-right {
          right: 1rem;
        }

        .mobile-swipe-indicator {
          font-size: 10px;
          letter-spacing: 1.5px;
          color: #887a6d;
          text-transform: uppercase;
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        @media (min-width: 768px) {
          .unified-product-card {
            flex: 0 0 280px; /* Fixed width on desktop */
          }
          .mobile-swipe-indicator {
            display: none;
          }
          .unified-carousel-wrapper {
            padding: 2rem 4rem; /* More padding on desktop for arrows */
          }
        }
      `}</style>

      <div className="unified-product-rail" ref={carouselRef}>
        {products.map((product, index) => (
          <Link href={`/products/${product.slug}`} key={product._id} className="unified-product-card" prefetch={false}>
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
            ←
          </button>
          <button 
            onClick={scrollRight}
            aria-label="Next featured product"
            className="unified-nav-btn nav-right"
          >
            →
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

