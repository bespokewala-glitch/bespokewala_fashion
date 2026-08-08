"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const containerStyle: React.CSSProperties = {
    padding: '8rem 2rem 4rem 2rem',
    maxWidth: '1400px',
    margin: '0 auto',
    minHeight: '80vh',
    fontFamily: '"Jost", "Inter", sans-serif',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: 300,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '3rem',
    textAlign: 'center',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '3rem 2rem',
  };

  if (!mounted) return null; // Wait for client hydration to read local storage

  return (
    <>
            <main style={containerStyle} className="mobile-p-4 mobile-pt-20">
        <h1 style={titleStyle}>Your Wishlist</h1>

        {wishlist.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '4rem', color: '#666' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>You haven't saved any items yet.</p>
            <Link 
              href="/products?productType=couture" 
              style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                backgroundColor: '#111',
                color: '#fff',
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontSize: '0.85rem',
              }}
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div style={gridStyle} className="mobile-grid-1">
            {wishlist.map(item => (
              <div key={item.slug} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                <Link href={`/products/${item.slug}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden', backgroundColor: '#f9f9f9' }}>
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 400, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      {item.name}
                    </h3>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      INR {item.price.toLocaleString('en-IN')}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFromWishlist(item.slug);
                  }}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'transparent',
                    border: 'none',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    transition: 'all 0.2s ease',
                  }}
                  aria-label="Remove from wishlist"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
          </>
  );
}
