"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';
import OptimizedImage from '@/components/ui/OptimizedImage';

export default function PremiumFeaturedCarousel({ products }: { products: any[] }) {
  const { formatPrice } = useCurrency();
  // We need enough items to create a smooth loop. 
  // If the user only has 2-4 featured products, we duplicate them to ensure the carousel never runs empty.
  const getExtendedProducts = () => {
    let extended = [...products];
    while (extended.length < 7) {
      extended = [...extended, ...products];
    }
    // Give them unique IDs for Framer Motion to track them properly during reordering
    return extended.map((p, i) => ({ ...p, uniqueId: `${p._id}-${i}` }));
  };

  const [items, setItems] = useState<any[]>([]);
  const [windowWidth, setWindowWidth] = useState(1200);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      setItems(getExtendedProducts());
    }
  }, [products]);

  // Auto-scroll logic
  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => {
      handleNext();
    }, 4000); // 4 seconds
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
    // We only care if they clicked an item that is NOT the center.
    // Center is index 3 (in an array of 7 visible items: 0, 1, 2, [3], 4, 5, 6)
    const centerIndex = 3;
    if (index === centerIndex) return;

    const diff = index - centerIndex;
    
    setItems((prev) => {
      let newItems = [...prev];
      if (diff > 0) {
        // shift left by diff
        for (let i = 0; i < diff; i++) {
          const first = newItems.shift();
          if (first) newItems.push(first);
        }
      } else {
        // shift right by abs(diff)
        for (let i = 0; i < Math.abs(diff); i++) {
          const last = newItems.pop();
          if (last) newItems.unshift(last);
        }
      }
      return newItems;
    });
  };

  if (items.length === 0) return null;

  // We will render exactly 7 items to have a center (3), two adjacents (2, 4), two outers (1, 5) and two hidden edges (0, 6)
  const visibleItems = items.slice(0, 7);
  const centerIndex = 3;

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', padding: '4rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', position: 'relative' }}>
        <AnimatePresence mode="popLayout">
          {visibleItems.map((product, index) => {
            const isCenter = index === centerIndex;
            const distance = Math.abs(index - centerIndex);
            
            // Calculate dynamic styles based on distance from center
            let width = '300px';
            let height = '450px';
            let scale = 1;
            let opacity = 1;
            let zIndex = 10;
            let display = 'flex';

            const isMobile = windowWidth < 768;

            if (distance === 0) {
              // Center item
              width = isMobile ? '280px' : '320px';
              height = isMobile ? '420px' : '480px';
              scale = 1.05;
              opacity = 1;
              zIndex = 20;
            } else if (distance === 1) {
              // Immediate left/right
              width = isMobile ? '0px' : '240px';
              height = isMobile ? '0px' : '360px';
              scale = 0.95;
              opacity = isMobile ? 0 : 0.7;
              zIndex = 10;
              if (isMobile) display = 'none';
            } else if (distance === 2) {
              // Outer left/right
              width = '180px';
              height = '270px';
              scale = 0.85;
              opacity = 0.3;
              zIndex = 5;
            } else {
              // Hidden edges (for smooth entrance/exit)
              width = '0px';
              height = '0px';
              scale = 0;
              opacity = 0;
              zIndex = 0;
              display = 'none'; // Completely hide them, but keep in DOM for layout animation
            }

            return (
              <motion.div
                layout // This tells Framer Motion to animate the change in position and size!
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
                {/* Wrap in link ONLY if it's the center item, otherwise click just brings it to center */}
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  {isCenter ? (
                    <Link href={`/products/${product.slug}`} style={{ display: 'block', width: '100%', height: '100%', position: 'relative' }}>
                      <OptimizedImage 
                        src={product.images[0]} 
                        alt={`Bespokewala ${product.name}`} 
                        fill
                        style={{ objectFit: 'cover' }}
                        variant="thumbnail"
                        sizes="(max-width: 768px) 300px, 400px"
                      />
                    </Link>
                  ) : (
                    <OptimizedImage 
                      src={product.images[0]} 
                      alt={`Bespokewala ${product.name}`} 
                      fill
                      style={{ objectFit: 'cover' }}
                      variant="thumbnail"
                      sizes="(max-width: 768px) 300px, 400px"
                    />
                  )}

                  {/* Gradient Overlay for Text */}
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
                    opacity: isCenter ? 1 : 0, // Only show text on center item
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

      {/* Navigation Buttons (Optional, but good for manual control) */}
      <button 
        onClick={handlePrev}
        aria-label="Previous featured product"
        style={{
          position: 'absolute',
          left: '5%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: '#fff',
          border: '1px solid #eee',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem'
        }}
      >
        ←
      </button>
      <button 
        onClick={handleNext}
        aria-label="Next featured product"
        style={{
          position: 'absolute',
          right: '5%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: '#fff',
          border: '1px solid #eee',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem'
        }}
      >
        →
      </button>

    </div>
  );
}
