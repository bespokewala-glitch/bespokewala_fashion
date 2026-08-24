'use client';

import React from 'react';

export default function ProductTrustBadges() {
  return (
    <div className="product-trust-badges">
      <style>{`
        .product-trust-badges {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #eaeaea;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem 0.5rem;
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
          .product-trust-badges {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }
          .trust-text {
            font-size: 0.8rem;
          }
        }
      `}</style>

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
          Dispatch in 15-20 days
        </div>
      </div>

      <div className="trust-badge">
        <div className="trust-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <div className="trust-text">
          <span className="trust-title">Alterations</span>
          Custom alteration available
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
          Online Payment & COD Available
        </div>
      </div>
    </div>
  );
}
