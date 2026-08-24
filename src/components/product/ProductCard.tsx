"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import ProductCardWishlistButton from './ProductCardWishlistButton';

export interface ProductCardProps {
  product: {
    name: string;
    slug: string;
    price: number;
    images: string[];
    category: string;
    productType?: string;
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
  const [isHovered, setIsHovered] = useState(false);
  const primaryImageRaw = product.images?.[0];
  const hoverImageRaw =
    product.images?.[1] ||
    product.referenceImages?.front ||
    product.referenceImages?.back ||
    product.referenceImages?.left ||
    product.referenceImages?.right;

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  const sharedImgStyle: React.CSSProperties = {
    objectFit: 'cover',
    transition: 'opacity 0.35s ease',
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      prefetch={false}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
        {primaryImageRaw && (
          <OptimizedImage
            src={primaryImageRaw}
            alt={`${product.name}${product.category ? ` in ${product.category}` : ''}`}
            fill
            sizes="(max-width: 480px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            style={{ ...sharedImgStyle, objectPosition: 'top' }}
            priority={priority}
            variant="thumbnail"
            className="product-card-primary-image"
          />
        )}

        {/*
          Hover image — desktop only, strictly lazy-loaded on actual hover event.
          This saves massive amounts of unnecessary network requests for category grids.
        */}
        {hoverImageRaw && hoverImageRaw !== primaryImageRaw && isHovered && (
          <OptimizedImage
            src={hoverImageRaw}
            alt={`Alternate view of ${product.name}${product.category ? ` (${product.category})` : ''}`}
            fill
            sizes="(max-width: 480px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            style={{ ...sharedImgStyle, zIndex: 2, objectPosition: 'top' }}
            priority={false}
            variant="thumbnail"
            className="product-card-hover-image"
            loading="lazy"
          />
        )}

        {/* Wishlist button */}
        <ProductCardWishlistButton
          product={{
            slug: product.slug,
            name: product.name,
            price: product.price,
            primaryImage: primaryImageRaw || '',
            productType: product.productType,
          }}
        />
      </div>

      {/* Product info */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <h3
          style={{
            fontSize: '0.875rem',
            fontWeight: 400,
            letterSpacing: '0.05em',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
          }}
        >
          {product.name}
        </h3>
        <span style={{ fontSize: '0.875rem', color: '#666' }}>
          {product.productType?.toLowerCase() === 'jewellery' ? 'Price on Request' : formattedPrice}
        </span>
      </div>
    </Link>
  );
}
