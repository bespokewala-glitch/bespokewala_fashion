"use client";

import React from 'react';

import { useWishlist } from '@/context/WishlistContext';

interface ProductActionsProps {
  product: {
    slug: string;
    name: string;
    price: number;
    images: string[];
  };
}

export default function ProductActions({ product }: ProductActionsProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.slug);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback for browsers that do not support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleLike = () => {
    if (isWishlisted) {
      removeFromWishlist(product.slug);
    } else {
      addToWishlist({
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '',
      });
    }
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', color: '#333' }}>
      <button 
        onClick={handleLike}
        aria-label="Add to Wishlist" 
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={isWishlisted ? "#ff4d4f" : "none"} stroke={isWishlisted ? "#ff4d4f" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
        </svg>
      </button>
      <button 
        onClick={handleShare}
        aria-label="Share" 
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/>
          <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
        </svg>
      </button>
    </div>
  );
}
