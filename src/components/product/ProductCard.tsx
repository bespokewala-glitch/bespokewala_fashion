"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  priority?: boolean; // true for first ~4 above-the-fold cards
}



export default function ProductCard({ product, variant = 'default', priority = false }: ProductCardProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.slug);
  const [isHovered, setIsHovered] = useState(false);

  /**
   * Normalize legacy ?file= query-param URLs to clean path-based URLs.
   * /api/media URLs are kept as-is — they are served via the authenticated
   * GCS proxy (/api/media/[...path]) which does not require public bucket access.
   * next/image uses unoptimized={true} for these to bypass the optimizer.
   */
  const sanitizeUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    // Convert old format: /api/media?file=uploads/foo.png → /api/media/uploads/foo.png
    return url.replace(/^\/api\/media\?file=/, '/api/media/');
  };

  const primaryImage = sanitizeUrl(product.images[0]) || '';
  const hoverImage = sanitizeUrl(
    product.images[1] ||
    product.referenceImages?.front ||
    product.referenceImages?.back ||
    product.referenceImages?.left ||
    product.referenceImages?.right
  ) || null;

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
        image: primaryImage || '',
      });
    }
  };

  const sharedImgStyle: React.CSSProperties = {
    objectFit: 'cover',
    transition: 'opacity 0.35s ease',
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      prefetch={false}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        cursor: 'pointer',
        position: 'relative',
        textDecoration: 'none',
        color: 'inherit',
      }}
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '2/3',
          overflow: 'hidden',
          backgroundColor: '#f5f5f5',
          borderRadius: variant === 'slider' ? '24px' : '0px',
        }}
      >
        {/* Primary image */}
        {primaryImage && (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            style={{ ...sharedImgStyle, objectPosition: 'top' }}
            priority={priority}
            unoptimized={primaryImage.startsWith('/api/')}
          />
        )}

        {/* Hover image — always mounted but faded in on hover for smooth transition */}
        {hoverImage && (
          <Image
            src={hoverImage}
            alt={`${product.name} alternate`}
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            style={{ ...sharedImgStyle, zIndex: 2, objectPosition: 'top', opacity: isHovered ? 1 : 0 }}
            priority={false}
            unoptimized={hoverImage.startsWith('/api/')}
          />
        )}

        {/* Wishlist button */}
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
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
            fill={isWishlisted ? '#fff' : 'none'} stroke="#fff" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>
      </div>

      {/* Product info */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: 400,
          letterSpacing: '0.05em',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
        }}>
          {product.name}
        </h3>
        <span style={{ fontSize: '0.875rem', color: '#666' }}>
          INR {product.price.toLocaleString('en-IN')}
        </span>
      </div>
    </Link>
  );
}
