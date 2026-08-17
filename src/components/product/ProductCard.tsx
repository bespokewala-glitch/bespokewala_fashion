"use client";

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { normalizeImageUrl, shouldBypassOptimizer, PLACEHOLDER_IMAGE } from '@/lib/imageUrl';
import ProductCardWishlistButton from './ProductCardWishlistButton';

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
  // Resolve primary image: try thumbnail variant first, fall back to original
  const primaryImageRaw  = product.images[0];
  const primaryThumb     = normalizeImageUrl(primaryImageRaw, 'thumbnail');
  const primaryOriginal  = normalizeImageUrl(primaryImageRaw);

  // Resolve hover image from images[1] or first available reference image
  const hoverImageRaw = product.images[1]
    || product.referenceImages?.front
    || product.referenceImages?.back
    || product.referenceImages?.left
    || product.referenceImages?.right;
  const hoverThumb    = hoverImageRaw ? normalizeImageUrl(hoverImageRaw, 'thumbnail') : '';
  const hoverOriginal = hoverImageRaw ? normalizeImageUrl(hoverImageRaw) : '';

  // Track per-image error state so we can gracefully fall back
  // Fallback order: thumbnail → original → placeholder (no infinite loops)
  const [primarySrc, setPrimarySrc] = useState(primaryThumb || primaryOriginal || PLACEHOLDER_IMAGE);
  const [hoverSrc,   setHoverSrc]   = useState(hoverThumb || hoverOriginal || PLACEHOLDER_IMAGE);

  const handlePrimaryError = useCallback(() => {
    if (primarySrc === primaryThumb && primaryOriginal) {
      // Thumbnail failed → try full original
      console.warn(`[ProductCard] Thumbnail failed for "${primaryImageRaw}", falling back to original`);
      setPrimarySrc(primaryOriginal);
    } else {
      // Original also failed → show placeholder
      console.warn(`[ProductCard] Original failed for "${primaryImageRaw}", falling back to placeholder`);
      setPrimarySrc(PLACEHOLDER_IMAGE);
    }
  }, [primarySrc, primaryThumb, primaryOriginal, primaryImageRaw]);

  const handleHoverError = useCallback(() => {
    if (hoverSrc === hoverThumb && hoverOriginal) {
      setHoverSrc(hoverOriginal);
    } else {
      setHoverSrc(PLACEHOLDER_IMAGE);
    }
  }, [hoverSrc, hoverThumb, hoverOriginal]);

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style:              'currency',
    currency:           'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  const sharedImgStyle: React.CSSProperties = {
    objectFit:  'cover',
    transition: 'opacity 0.35s ease',
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      prefetch={false}
      style={{
        display:        'flex',
        flexDirection:  'column',
        gap:            '1rem',
        cursor:         'pointer',
        position:       'relative',
        textDecoration: 'none',
        color:          'inherit',
      }}
      className="product-card"
    >
      <div
        style={{
          position:        'relative',
          width:           '100%',
          aspectRatio:     '2/3',
          overflow:        'hidden',
          backgroundColor: '#f5f5f5',
          borderRadius:    variant === 'slider' ? '24px' : '0px',
        }}
      >
        {/* Primary image — uses thumbnail with automatic fallback to original then placeholder */}
        {primarySrc && (
          <Image
            src={primarySrc}
            alt={product.name}
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            style={{ ...sharedImgStyle, objectPosition: 'top' }}
            priority={priority}
            // All /api/media/ URLs bypass Next.js optimizer (prevents recursive /_next/image calls)
            unoptimized={shouldBypassOptimizer(primarySrc)}
            onError={handlePrimaryError}
            className="product-card-primary-image"
          />
        )}

        {/* Hover image — shown via CSS .product-card:hover .product-card-hover-image */}
        {hoverSrc && hoverSrc !== primarySrc && (
          <Image
            src={hoverSrc}
            alt={`${product.name} alternate`}
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            style={{ ...sharedImgStyle, zIndex: 2, objectPosition: 'top' }}
            priority={false}
            unoptimized={shouldBypassOptimizer(hoverSrc)}
            onError={handleHoverError}
            className="product-card-hover-image"
          />
        )}

        {/* Wishlist button */}
        <ProductCardWishlistButton
          product={{
            slug:         product.slug,
            name:         product.name,
            price:        product.price,
            primaryImage: primaryOriginal || '',
          }}
        />
      </div>

      {/* Product info */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <h3 style={{
          fontSize:      '0.875rem',
          fontWeight:    400,
          letterSpacing: '0.05em',
          marginBottom:  '0.5rem',
          textTransform: 'uppercase',
        }}>
          {product.name}
        </h3>
        <span style={{ fontSize: '0.875rem', color: '#666' }}>
          {formattedPrice}
        </span>
      </div>
    </Link>
  );
}
