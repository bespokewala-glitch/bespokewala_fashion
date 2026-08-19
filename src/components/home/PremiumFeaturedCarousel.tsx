'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';
import OptimizedImage from '@/components/ui/OptimizedImage';

export default function PremiumFeaturedCarousel({ products }: { products: any[] }) {
  const { formatPrice } = useCurrency();
  const [items, setItems] = useState<any[]>([]);

  // Mobile Auto-Scroll Logic
  const mobileRailRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef(false);
  
  // Duplicate products extensively to create a robust seamless infinite loop 
  // without complex mid-scroll jump math. 15 sets is typically ~60-75 cards.
  const mobileProducts = Array.from({ length: 15 }).flatMap(() => products);

  useEffect(() => {
    const rail = mobileRailRef.current;
    if (!rail) return;
    
    // We will use a reliable, continuous interval.
    const interval = setInterval(() => {
      // Pause if tab is hidden or user is interacting
      if (document.hidden || isInteractingRef.current) return;
      
      const el = mobileRailRef.current;
      if (!el) return;
      
      const cards = el.children;
      if (cards.length === 0) return;
      
      const firstCard = cards[0] as HTMLElement;
      const cardWidth = firstCard.offsetWidth + 14; 
      if (cardWidth <= 14) return; // Not fully rendered yet
      
      // Calculate which card we are currently snapped to
      const currentIndex = Math.round(el.scrollLeft / cardWidth);
      
      // If we are reaching the end of our cloned sets, jump back to the middle
      if (currentIndex >= mobileProducts.length - 4) {
        const middleIndex = Math.floor(mobileProducts.length / 2);
        const middleChild = cards[middleIndex] as HTMLElement;
        if (middleChild) {
          // Instant jump (invisible to user)
          el.scrollTo({ left: middleChild.offsetLeft - 20, behavior: 'auto' });
          
          // Wait a tiny fraction for DOM to settle, then smooth scroll to the *next* one
          setTimeout(() => {
            if (mobileRailRef.current) {
              const nextTarget = mobileRailRef.current.children[middleIndex + 1] as HTMLElement;
              if (nextTarget) {
                mobileRailRef.current.scrollTo({ left: nextTarget.offsetLeft - 20, behavior: 'smooth' });
              }
            }
          }, 50);
        }
        return;
      }
      
      // Normal smooth advance to the exact next card
      const nextIndex = currentIndex + 1;
      const targetChild = cards[nextIndex] as HTMLElement;
      
      if (targetChild) {
        // We subtract 20 to account for the container's padding-left: 20px
        el.scrollTo({ left: targetChild.offsetLeft - 20, behavior: 'smooth' });
      }
    }, 4000);
    
    return () => clearInterval(interval);
  }, [mobileProducts.length]);

  // Handle touch interactions to pause auto-scroll
  useEffect(() => {
    const rail = mobileRailRef.current;
    if (!rail) return;
    
    let resumeTimeout: NodeJS.Timeout;
    
    const handleInteractStart = () => {
      isInteractingRef.current = true;
      clearTimeout(resumeTimeout);
    };
    
    const handleInteractEnd = () => {
      clearTimeout(resumeTimeout);
      // Wait 4 seconds after user stops touching before resuming
      resumeTimeout = setTimeout(() => {
        isInteractingRef.current = false;
      }, 4000);
    };

    // Use passive listeners for scroll performance
    rail.addEventListener('touchstart', handleInteractStart, { passive: true });
    rail.addEventListener('touchend', handleInteractEnd, { passive: true });
    rail.addEventListener('pointerdown', handleInteractStart, { passive: true });
    rail.addEventListener('pointerup', handleInteractEnd, { passive: true });
    
    return () => {
      rail.removeEventListener('touchstart', handleInteractStart);
      rail.removeEventListener('touchend', handleInteractEnd);
      rail.removeEventListener('pointerdown', handleInteractStart);
      rail.removeEventListener('pointerup', handleInteractEnd);
      clearTimeout(resumeTimeout);
    };
  }, []);

  // Desktop Carousel Logic
  const getExtendedProducts = () => {
    let extended = [...products];
    while (extended.length < 7) {
      extended = [...extended, ...products];
    }
    return extended.map((p, i) => ({ ...p, uniqueId: `${p._id}-${i}` }));
  };

  useEffect(() => {
    if (products.length > 0) {
      setItems(getExtendedProducts());
    }
  }, [products]);

  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => {
      handleNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [items]);

  const handleNext = () => {
    setItems((prev) => {
      const newItems = [...prev];
      const first = newItems.shift();
      if (first) newItems.push(first);
      return newItems;
    });
  };

  const handlePrev = () => {
    setItems((prev) => {
      const newItems = [...prev];
      const last = newItems.pop();
      if (last) newItems.unshift(last);
      return newItems;
    });
  };

  const handleItemClick = (index: number) => {
    const centerIndex = 3;
    if (index === centerIndex) return;

    const diff = index - centerIndex;
    
    setItems((prev) => {
      let newItems = [...prev];
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          const first = newItems.shift();
          if (first) newItems.push(first);
        }
      } else {
        for (let i = 0; i < Math.abs(diff); i++) {
          const last = newItems.pop();
          if (last) newItems.unshift(last);
        }
      }
      return newItems;
    });
  };

  if (items.length === 0 || products.length === 0) return null;

  const visibleItems = items.slice(0, 7);
  const centerIndex = 3;

  return (
    <div className="premium-carousel-wrapper">
      <style>{`
        .premium-carousel-wrapper {
          width: 100%;
        }

        /* -----------------------
           DESKTOP CAROUSEL
           ----------------------- */
        .desktop-carousel-container {
          position: relative;
          width: 100%;
          overflow: hidden;
          padding: 4rem 0;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .desktop-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-color: #fff;
          border: 1px solid #eee;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          cursor: pointer;
          z-index: 30;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        /* -----------------------
           MOBILE CAROUSEL
           ----------------------- */
        .mobile-carousel-container {
          display: none;
        }

        @media (max-width: 767px) {
          .desktop-carousel-container {
            display: none !important;
          }
          .mobile-carousel-container {
            display: block;
            width: 100%;
          }

          .mobile-product-rail {
            position: relative;
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
            gap: 14px;
            padding: 0 0 20px 20px; /* Right padding allows scroll bleed */
            scroll-behavior: smooth;
          }

          .mobile-product-rail::-webkit-scrollbar {
            display: none;
          }

          .mobile-product-card {
            scroll-snap-align: start;
            flex: 0 0 72vw; /* Approx 295px at 412 viewport */
            max-width: 320px;
            display: flex;
            flex-direction: column;
            text-align: left;
          }
          
          .mobile-product-card:last-child {
            margin-right: 20px;
          }

          .mobile-product-image-wrap {
            width: 100%;
            aspect-ratio: 4 / 5;
            position: relative;
            border-radius: 2px;
            overflow: hidden;
            background-color: #F8F6F1;
            border: 1px solid rgba(80,70,60,0.08);
          }

          .mobile-product-info {
            margin-top: 12px;
            padding-right: 10px;
          }

          .mobile-product-title {
            font-size: 11.5px;
            letter-spacing: 1.2px;
            text-transform: uppercase;
            color: #111;
            margin: 0 0 5px 0;
            line-height: 1.35;
            font-weight: 500;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .mobile-product-price {
            font-size: 12px;
            font-weight: 400;
            color: #555;
            margin: 0;
          }

          .mobile-swipe-indicator {
            font-size: 9px;
            letter-spacing: 1.5px;
            color: #887a6d;
            text-transform: uppercase;
            margin-top: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          }
        }
      `}</style>

      {/* =========================================
          DESKTOP VIEW 
          ========================================= */}
      <div className="desktop-carousel-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', position: 'relative' }}>
          <AnimatePresence mode="popLayout">
            {visibleItems.map((product, index) => {
              const isCenter = index === centerIndex;
              const distance = Math.abs(index - centerIndex);
              
              let width = '300px';
              let height = '450px';
              let scale = 1;
              let opacity = 1;
              let zIndex = 10;
              let display = 'flex';

              if (distance === 0) {
                width = '320px';
                height = '480px';
                scale = 1.05;
                opacity = 1;
                zIndex = 20;
              } else if (distance === 1) {
                width = '240px';
                height = '360px';
                scale = 0.95;
                opacity = 0.7;
                zIndex = 10;
              } else if (distance === 2) {
                width = '180px';
                height = '270px';
                scale = 0.85;
                opacity = 0.3;
                zIndex = 5;
              } else {
                width = '0px';
                height = '0px';
                scale = 0;
                opacity = 0;
                zIndex = 0;
                display = 'none';
              }

              return (
                <motion.div
                  layout
                  key={product.uniqueId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ width, height, scale, opacity, zIndex }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 25,
                    mass: 1,
                  }}
                  onClick={() => handleItemClick(index)}
                  style={{
                    display,
                    flexDirection: 'column',
                    position: 'relative',
                    cursor: isCenter ? 'default' : 'pointer',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    boxShadow: isCenter ? '0 20px 40px rgba(0,0,0,0.15)' : 'none',
                  }}
                >
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    {isCenter ? (
                      <Link href={`/products/${product.slug}`} style={{ display: 'block', width: '100%', height: '100%', position: 'relative' }}>
                        <OptimizedImage 
                          src={product.images[0]} 
                          alt={`Bespokewala ${product.name}`} 
                          fill
                          style={{ objectFit: 'cover' }}
                          variant="thumbnail"
                        />
                      </Link>
                    ) : (
                      <OptimizedImage 
                        src={product.images[0]} 
                        alt={`Bespokewala ${product.name}`} 
                        fill
                        style={{ objectFit: 'cover' }}
                        variant="thumbnail"
                      />
                    )}

                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '2rem 1.5rem',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      opacity: isCenter ? 1 : 0,
                      transition: 'opacity 0.4s ease',
                      pointerEvents: 'none',
                    }}>
                      <h3 style={{ color: '#fff', fontSize: '1.25rem', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {product.name}
                      </h3>
                      <p style={{ color: '#eee', margin: 0, fontSize: '0.9rem' }}>
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <button 
          onClick={handlePrev}
          aria-label="Previous featured product"
          className="desktop-nav-btn"
          style={{ left: '5%' }}
        >
          ←
        </button>
        <button 
          onClick={handleNext}
          aria-label="Next featured product"
          className="desktop-nav-btn"
          style={{ right: '5%' }}
        >
          →
        </button>
      </div>

      {/* =========================================
          MOBILE VIEW (LUXURY HORIZONTAL RAIL)
          ========================================= */}
      <div className="mobile-carousel-container">
        <div className="mobile-product-rail" ref={mobileRailRef}>
          {mobileProducts.map((product, index) => (
            <Link href={`/products/${product.slug}`} key={`${product._id}-${index}`} className="mobile-product-card">
              <div className="mobile-product-image-wrap">
                <OptimizedImage 
                  src={product.images[0]} 
                  alt={`Bespokewala ${product.name}`} 
                  fill
                  style={{ objectFit: 'cover' }}
                  variant="thumbnail"
                  sizes="(max-width: 768px) 80vw"
                />
              </div>
              <div className="mobile-product-info">
                <h3 className="mobile-product-title">{product.name}</h3>
                <p className="mobile-product-price">{formatPrice(product.price)}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mobile-swipe-indicator">
          SWIPE TO EXPLORE <span>&rarr;</span>
        </div>
      </div>

    </div>
  );
}
