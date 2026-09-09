'use client';

import React, { useState } from 'react';
import { getShippingEstimate } from '@/lib/shippingPolicy';

interface ProductTrustBadgesProps {
  productType?: string;
  category?: string;
  subcategory?: string;
}

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#666"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transition: 'transform 0.3s ease',
      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
      flexShrink: 0,
    }}
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function ProductTrustBadges({ productType, category, subcategory }: ProductTrustBadgesProps) {
  const shippingEstimate = getShippingEstimate(productType, category, subcategory);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="product-trust-badges-wrapper">
      <style>{`
        .product-trust-badges-wrapper {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #eaeaea;
        }
        
        .trust-badges-header {
          display: none;
        }

        .trust-badges-content {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem 0.5rem;
          overflow: hidden;
        }

        .trust-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .trust-icon {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
          color: #d2b48c;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .trust-icon svg {
          width: 100%;
          height: 100%;
        }
        .trust-text {
          font-size: 0.75rem;
          color: #555;
          line-height: 1.3;
        }
        .trust-title {
          font-weight: 500;
          color: #111;
          display: block;
          margin-bottom: 2px;
        }
        
        @media (max-width: 480px) {
          .product-trust-badges-wrapper {
            margin-top: 0;
            padding-top: 0;
            border-top: none;
            border-bottom: 1px solid #e0e0e0;
            padding: 0.85rem 0;
          }
          
          .trust-badges-header {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            text-align: left;
            font-size: 0.9rem;
            font-weight: 500;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: #111;
          }
          
          .trust-badges-content-container {
            max-height: ${isMobileOpen ? '400px' : '0'};
            overflow: hidden;
            transition: max-height 0.3s ease-in-out;
          }
          
          .trust-badges-content {
            grid-template-columns: 1fr;
            gap: 1.25rem;
            padding-top: 0.85rem;
            padding-bottom: 0.5rem;
          }
          
          .trust-text {
            font-size: 0.8rem;
          }
        }
      `}</style>
      
      <button 
        className="trust-badges-header"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-expanded={isMobileOpen}
      >
        Services & Assurances
        <ChevronIcon isOpen={isMobileOpen} />
      </button>

      <div className="trust-badges-content-container">
        <div className="trust-badges-content">
          <div className="trust-badge">
            <div className="trust-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
              </svg>
            </div>
            <div className="trust-text">
              <span className="trust-title">Customisation</span>
              Bespoke tailoring available
            </div>
          </div>

          <div className="trust-badge">
            <div className="trust-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="trust-text">
              <span className="trust-title">Delivery Time</span>
              Dispatch in {shippingEstimate}
            </div>
          </div>

          <div className="trust-badge">
            <div className="trust-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="trust-text">
              <span className="trust-title">Secure Payments</span>
              Online Payments Accepted
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

