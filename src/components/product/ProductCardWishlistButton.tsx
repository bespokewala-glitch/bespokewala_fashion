"use client";

import React from 'react';
import { useWishlist } from '@/context/WishlistContext';

interface ProductCardWishlistButtonProps {
  product: {
    slug: string;
    name: string;
    price: number;
    primaryImage: string;
  };
}

export default function ProductCardWishlistButton({ product }: ProductCardWishlistButtonProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.slug);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist(product.slug);
    } else {
      addToWishlist({
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.primaryImage,
      });
    }
  };

  return (
    <button
      onClick={handleWishlistClick}
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
        transition: 'transform 0.2s ease',
      }}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={isWishlisted ? '#fff' : 'none'}
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </button>
  );
}
