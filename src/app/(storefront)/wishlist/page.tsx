"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';
import { useCurrency } from '@/context/CurrencyContext';
import { normalizeImageUrl } from '@/lib/imageUrl';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Wait for client hydration to read local storage

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .wishlist-container {
          padding: 1rem 12px 3rem 12px;
          max-width: 1400px;
          margin: 0 auto;
          min-height: 80vh;
          font-family: "Jost", "Inter", sans-serif;
        }
        @media (min-width: 768px) {
          .wishlist-container {
            padding: 8rem 2rem 6rem 2rem;
          }
        }
        .wishlist-header {
          text-align: center;
          margin-bottom: 0.75rem;
        }
        @media (min-width: 768px) {
          .wishlist-header {
            margin-bottom: 3.5rem;
          }
        }
        .wishlist-title {
          font-size: 1.25rem;
          font-weight: 300;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.25rem;
          color: #111;
        }
        @media (min-width: 768px) {
          .wishlist-title {
            font-size: 2rem;
            margin-bottom: 0.5rem;
          }
        }
        .wishlist-count {
          font-size: 0.65rem;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }
        @media (min-width: 768px) {
          .wishlist-count {
            font-size: 0.8rem;
          }
        }
        .wishlist-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(2, 1fr);
        }
        @media (min-width: 768px) {
          .wishlist-grid {
            gap: 2.5rem;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          }
        }
        .wishlist-card {
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .wishlist-image-container {
          position: relative;
          aspect-ratio: 2/3;
          overflow: hidden;
          background-color: #f9f9f9;
          margin-bottom: 1rem;
        }
        .wishlist-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.7s ease;
        }
        @media (hover: hover) {
          .wishlist-card:hover .wishlist-image {
            transform: scale(1.04);
          }
        }
        .wishlist-remove-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(255, 255, 255, 0.85);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: background-color 0.2s ease, transform 0.2s ease;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .wishlist-remove-btn:hover {
          background: rgba(255, 255, 255, 1);
          transform: scale(1.05);
        }
        .wishlist-details {
          display: flex;
          flex-direction: column;
          text-align: center;
          flex: 1;
        }
        .wishlist-product-name {
          font-size: 0.75rem;
          font-weight: 400;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin: 0 0 0.5rem 0;
          color: #111;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
        }
        @media (min-width: 768px) {
          .wishlist-product-name {
            font-size: 0.85rem;
          }
        }
        .wishlist-price {
          font-size: 0.8rem;
          color: #666;
          margin-bottom: 0.75rem;
        }
        .wishlist-move-to-bag {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #111;
          text-decoration: underline;
          text-underline-offset: 4px;
          margin-top: auto;
          display: inline-block;
          padding-bottom: 0.2rem;
          transition: color 0.2s ease;
        }
        .wishlist-move-to-bag:hover {
          color: #666;
        }
        .wishlist-empty {
          text-align: center;
          margin-top: 4rem;
          color: #111;
        }
        .wishlist-empty-title {
          font-size: 1.25rem;
          font-weight: 300;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }
        .wishlist-empty-desc {
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 2.5rem;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.5;
        }
        .wishlist-empty-btn {
          display: inline-block;
          padding: 1rem 3rem;
          background-color: #111;
          color: #fff;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-size: 0.75rem;
          transition: background-color 0.3s ease;
        }
        .wishlist-empty-btn:hover {
          background-color: #333;
        }
      `}} />
      <main className="wishlist-container">
        <div className="wishlist-header">
          <h1 className="wishlist-title">Your Wishlist</h1>
          {wishlist.length > 0 && (
            <div className="wishlist-count">
              YOUR CURATED SELECTION · {wishlist.length} PIECE{wishlist.length !== 1 ? 'S' : ''}
            </div>
          )}
        </div>

        {wishlist.length === 0 ? (
          <div className="wishlist-empty">
            <h2 className="wishlist-empty-title">Your Wishlist Is Waiting</h2>
            <p className="wishlist-empty-desc">
              Save the pieces that speak to you and return to them whenever inspiration calls.
            </p>
            <Link href="/products?productType=couture" className="wishlist-empty-btn">
              Continue Exploring
            </Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map(item => (
              <div key={item.slug} className="wishlist-card">
                <Link 
                  href={`/products/${item.slug}`} 
                  style={{ display: 'flex', flexDirection: 'column', height: '100%', textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="wishlist-image-container">
                    <img 
                      src={normalizeImageUrl(item.image) || item.image} 
                      alt={item.name} 
                      className="wishlist-image"
                      loading="lazy"
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFromWishlist(item.slug);
                      }}
                      className="wishlist-remove-btn"
                      aria-label="Remove from wishlist"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="#000" stroke="#000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                      </svg>
                    </button>
                  </div>
                  <div className="wishlist-details">
                    <h3 className="wishlist-product-name">
                      {item.name}
                    </h3>
                    <div className="wishlist-price">
                      {item.productType?.toLowerCase() === 'jewellery' ? 'Price on Request' : formatPrice(item.price)}
                    </div>
                    {item.productType?.toLowerCase() !== 'jewellery' && (
                      <span className="wishlist-move-to-bag">Move to Bag</span>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
