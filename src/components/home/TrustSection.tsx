'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';

export default function TrustSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const container = scrollContainerRef.current;
    
    let closestIndex = 0;
    let minDiff = Infinity;
    
    Array.from(container.children).forEach((child, index) => {
      const childCenter = (child as HTMLElement).offsetLeft + (child as HTMLElement).offsetWidth / 2;
      const containerCenter = scrollLeft + container.offsetWidth / 2;
      const diff = Math.abs(childCenter - containerCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });
    
    if (closestIndex !== activeIndex) {
      setActiveIndex(closestIndex);
    }
  };

  // Keep desktop styles mostly inline or in the generic classes
  // We'll reset mobile typography entirely in the media query.
  const titleStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    fontWeight: 500,
    color: '#333',
    margin: 0,
  };

  return (
    <section className="trust-container">
      <style>{`
        /* Desktop styles (Default) */
        .trust-container {
          padding: 4rem 2rem;
          background-color: #fff;
          border-top: 1px solid #f0f0f0;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          justify-content: center;
        }
        .trust-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 3rem;
          width: 100%;
          max-width: 1200px;
          text-align: center;
        }
        .trust-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }
        .trust-desc {
          font-size: 0.9rem;
          color: #777;
          font-style: italic;
          margin: 0;
          line-height: 1.4;
        }
        .trust-link {
          color: #c1a68d;
          text-decoration: none;
          font-size: 0.8rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 0.25rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
          transition: opacity 0.2s ease;
          min-height: 44px;
          min-width: 44px;
        }
        .trust-link:hover {
          opacity: 0.8;
        }
        .trust-link:hover .arrow-icon {
          transform: translateX(4px);
        }
        .arrow-icon {
          display: inline-block;
          margin-left: 4px;
          transition: transform 0.2s ease;
        }
        
        .trust-card-num {
          display: none; /* Hidden on desktop */
        }
        
        .mobile-header-wrapper,
        .mobile-indicator-wrapper {
          display: none;
        }

        /* Mobile specific styles */
        @media (max-width: 767px) {
          .trust-container {
            padding: 36px 0 0 0;
            display: block;
            border-top: none;
            border-bottom: none;
            background-color: #fff;
          }
          
          .mobile-header-wrapper {
            display: block;
            padding: 0 20px;
            margin-bottom: 30px;
            text-align: center;
          }
          .mobile-section-heading {
            font-size: 22px;
            letter-spacing: 2px;
            text-transform: uppercase;
            font-weight: 300;
            color: #111;
            margin: 0 0 8px 0;
          }
          .mobile-section-sub {
            font-size: 12px;
            color: #666;
            margin: 0;
            font-style: italic;
          }
          
          .trust-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px 16px;
            padding: 0 20px;
            text-align: left;
            margin-bottom: 30px;
          }
          
          .trust-item {
            align-items: flex-start;
            background-color: transparent;
            border: none;
            border-radius: 0;
            padding: 0;
            height: auto;
            gap: 0;
            justify-content: flex-start;
            max-width: 100%;
          }
          
          .trust-card-num {
            display: block;
            font-size: 9px;
            letter-spacing: 1.5px;
            color: #887a6d;
            margin-bottom: 12px;
          }

          .trust-item h3 {
            font-size: 13px !important;
            letter-spacing: 1.5px !important;
            color: #222 !important;
            margin-bottom: 8px !important;
            font-weight: 500 !important;
          }

          .trust-desc {
            font-size: 12px;
            color: #555;
            padding: 0;
            max-width: 100%;
            line-height: 1.5;
            font-style: normal; /* Editorial feel instead of italic */
          }
          
          .trust-link {
            font-size: 9.5px;
            letter-spacing: 1.5px;
            margin-top: 20px; /* Precise gap below description */
            color: #c1a68d;
            padding: 0;
            min-height: 44px;
            align-items: center;
          }
          
          .mobile-indicator-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            padding: 0 20px;
          }
          .indicator-text {
            font-size: 10px;
            letter-spacing: 0.1em;
            color: #666;
            font-family: monospace;
          }
          .indicator-bar-container {
            flex: 0 0 100px;
            height: 1px;
            background-color: #e5e5e5;
            position: relative;
          }
          .indicator-bar-progress {
            position: absolute;
            top: 0;
            left: 0;
            height: 1px;
            background-color: #333;
            transition: width 0.3s ease, left 0.3s ease;
          }
        }
      `}</style>

      {/* Mobile Heading */}
      <div className="mobile-header-wrapper">
        <h2 className="mobile-section-heading">The Bespokewala Experience</h2>
        <p className="mobile-section-sub">Thoughtfully crafted services designed around you.</p>
      </div>

      <div className="trust-grid" ref={scrollContainerRef} onScroll={handleScroll}>
        
        <div className="trust-item">
          <div className="trust-card-num">01</div>
          <h3 style={titleStyle}>Made to Order</h3>
          <p className="trust-desc">Crafted especially for your order.</p>
          <Link href="#couture-process" aria-label="Discover the Couture Process" className="trust-link">
            Discover the Process <span className="arrow-icon">&rarr;</span>
          </Link>
        </div>

        <div className="trust-item">
          <div className="trust-card-num">02</div>
          <h3 style={titleStyle}>Custom Sizing</h3>
          <p className="trust-desc">Designed to your measurements for a personalized fit.</p>
          <Link href="/size-guide" aria-label="View Size Guide" className="trust-link">
            View Size Guide <span className="arrow-icon">&rarr;</span>
          </Link>
        </div>

        <div className="trust-item">
          <div className="trust-card-num">03</div>
          <h3 style={titleStyle}>Personal Styling</h3>
          <p className="trust-desc">Guidance for choosing your look.</p>
          <Link href="/contact" aria-label="Book a Design Consultation" className="trust-link">
            Book a Consultation <span className="arrow-icon">&rarr;</span>
          </Link>
        </div>

        <div className="trust-item">
          <div className="trust-card-num">04</div>
          <h3 style={titleStyle}>Shipping & Returns</h3>
          <p className="trust-desc">Clear information about delivery, exchanges and returns.</p>
          <Link href="/shipping" aria-label="View Shipping and Return Policy" className="trust-link">
            View Shipping & Returns <span className="arrow-icon">&rarr;</span>
          </Link>
        </div>

      </div>


    </section>
  );
}
