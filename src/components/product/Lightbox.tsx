"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { getProductImageUrl } from '@/lib/imageUrl';

interface LightboxProps {
  images: { url: string; alt: string }[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function Lightbox({ images, initialIndex, isOpen, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Sync initialIndex when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
    }
  }, [isOpen, initialIndex]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // prevent background scrolling
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, currentIndex]);

  const handleNext = () => {
    setScale(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setScale(1);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  
  // Custom pinch/wheel zoom handler to prevent body scroll
  useEffect(() => {
    const container = containerRef.current;
    
    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * -0.01;
      setScale(prev => Math.min(Math.max(1, prev + zoomDelta), 4));
    };

    let initialPinchDistance = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialPinchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDistance > 0) {
        e.preventDefault(); // prevent zoom of the whole page
        const currentDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const distanceDelta = currentDistance - initialPinchDistance;
        const zoomDelta = distanceDelta * 0.01;
        setScale(prev => Math.min(Math.max(1, prev + zoomDelta), 4));
        initialPinchDistance = currentDistance;
      }
    };

    if (container && isOpen) {
      container.addEventListener('wheel', preventScroll, { passive: false });
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', preventScroll);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [isOpen]);

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
    } else {
      setScale(2.5); // Zoom in on double click
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              zIndex: 10000,
              padding: '10px',
            }}
          >
            <X size={32} strokeWidth={1.5} />
          </button>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                style={{
                  position: 'absolute',
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  zIndex: 10000,
                  padding: '20px',
                }}
              >
                <ChevronLeft size={48} strokeWidth={1} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  zIndex: 10000,
                  padding: '20px',
                }}
              >
                <ChevronRight size={48} strokeWidth={1} />
              </button>
            </>
          )}

          {/* Image Container */}
          <div
            ref={containerRef}
            onClick={onClose} // Close on background click
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <motion.img
              key={currentIndex}
              src={getProductImageUrl(images[currentIndex].url, 'large')}
              alt={images[currentIndex].alt}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: scale }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.16, 1, 0.3, 1], // luxury easeOutExpo curve
                scale: { type: "spring", stiffness: 300, damping: 30 }
              }}
              drag={scale > 1} // only allow drag if zoomed
              dragConstraints={containerRef} // constrain pan within the container
              dragElastic={0.1}
              onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(); }}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                cursor: scale > 1 ? 'grab' : 'zoom-in',
                userSelect: 'none',
              }}
            />
          </div>

          {/* Controls hint */}
          <div style={{
            position: 'absolute',
            bottom: '30px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.85rem',
            letterSpacing: '0.05em',
            display: 'flex',
            gap: '20px',
            pointerEvents: 'none',
            textTransform: 'uppercase'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ZoomIn size={16} /> Double-click or scroll to zoom
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
