"use client";

import React from 'react';
import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';

export interface ProductCardProps {
  product: {
    name: string;
    slug: string;
    price: number;
    images: string[];
    category: string;
    referenceImages?: {
      front?: string;
      back?: string;
      left?: string;
      right?: string;
    };
  };
  variant?: 'default' | 'slider';
}

export default function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.slug);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product page
    e.stopPropagation();
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

  const cardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    cursor: 'pointer',
    position: 'relative',
    textDecoration: 'none',
    color: 'inherit',
  };

  const imageContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: '2/3',
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
    borderRadius: variant === 'slider' ? '24px' : '0px',
  };

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.4s ease-in-out',
    position: 'absolute',
    top: 0,
    left: 0,
  };

  const infoStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 400,
    letterSpacing: '0.05em',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
  };

  const priceStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#666',
  };

  return (
    <Link href={`/products/${product.slug}`} style={cardStyle} className="product-card">
      <div style={imageContainerStyle}>
        <img 
          src={product.images[0]} 
          alt={product.name} 
          style={{ ...imgStyle, position: 'relative' }}
          className="product-img-primary"
        />
        {(product.images[1] || product.referenceImages?.front || product.referenceImages?.back || product.referenceImages?.left || product.referenceImages?.right) && (
          <img 
            src={product.images[1] || product.referenceImages?.front || product.referenceImages?.back || product.referenceImages?.left || product.referenceImages?.right} 
            alt={`${product.name} alternate`} 
            style={imgStyle}
            className="product-img-secondary"
          />
        )}
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
            transition: 'all 0.2s ease',
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted ? "#fff" : "none"} stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
        </button>
        <style>{`
          .product-card .product-img-secondary {
            opacity: 0;
          }
          .product-card:hover .product-img-secondary {
            opacity: 1;
          }
        `}</style>
      </div>
      <div style={infoStyle}>
        <h3 style={titleStyle}>{product.name}</h3>
        <span style={priceStyle}>INR {product.price.toLocaleString('en-IN')}</span>
      </div>
    </Link>
  );
}
