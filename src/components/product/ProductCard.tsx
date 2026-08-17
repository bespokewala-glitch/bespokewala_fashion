import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { normalizeImageUrl, shouldBypassOptimizer } from '@/lib/imageUrl';
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
  const primaryImage = normalizeImageUrl(product.images[0], 'thumbnail');
  const hoverImageRaw = product.images[1] ||
    product.referenceImages?.front ||
    product.referenceImages?.back ||
    product.referenceImages?.left ||
    product.referenceImages?.right;
  const hoverImage = hoverImageRaw ? normalizeImageUrl(hoverImageRaw, 'thumbnail') : '';

  // Use Intl.NumberFormat instead of the context hook to format price server-side
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
        {/* Primary image */}
        {primaryImage && (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            style={{ ...sharedImgStyle, objectPosition: 'top' }}
            priority={priority}
            unoptimized={shouldBypassOptimizer(primaryImage)}
            className="product-card-primary-image"
          />
        )}

        {/* Hover image — mapped via CSS .product-card:hover .product-card-hover-image */}
        {hoverImage && (
          <Image
            src={hoverImage}
            alt={`${product.name} alternate`}
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            style={{ ...sharedImgStyle, zIndex: 2, objectPosition: 'top' }}
            priority={false}
            unoptimized={shouldBypassOptimizer(hoverImage)}
            className="product-card-hover-image"
          />
        )}

        {/* Wishlist button */}
        <ProductCardWishlistButton 
          product={{ 
            slug: product.slug, 
            name: product.name, 
            price: product.price, 
            primaryImage: primaryImage || '' 
          }} 
        />
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
          {formattedPrice}
        </span>
      </div>
    </Link>
  );
}
