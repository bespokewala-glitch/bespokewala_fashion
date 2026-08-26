'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChatProduct } from './ChatbotWidget';
import { useWishlist } from '@/context/WishlistContext';

interface ChatProductCardProps {
  product: ChatProduct;
  onShowSimilar?: () => void;
  onClose?: () => void;
}

function formatImageUrl(url: string | undefined): string | null {
  if (!url) return null;
  // If it's already a full URL or proxy path, use as-is with micro variant for chat
  if (url.startsWith('/api/media/')) {
    return `${url}${url.includes('?') ? '&' : '?'}v=micro`;
  }
  if (url.startsWith('http')) return url;
  // If it looks like a filename/path stored in DB, route through the media proxy
  return `/api/media/${url}?v=micro`;
}

export default function ChatProductCard({ product, onShowSimilar, onClose }: ChatProductCardProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.slug);
  const [wishlistAnimating, setWishlistAnimating] = useState(false);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistAnimating(true);
    setTimeout(() => setWishlistAnimating(false), 400);

    if (inWishlist) {
      removeFromWishlist(product.slug);
    } else {
      addToWishlist({
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image || '',
        productType: product.productType,
      });
    }
  };

  const imageUrl = formatImageUrl(product.image);
  const productUrl = `/products/${product.slug}`;

  return (
    <div className="chatbot-product-card">
      <Link 
        href={productUrl} 
        onClick={onClose} 
        style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', flex: 1 }}
      >
        {/* Image */}
        <div style={{ position: 'relative' }}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={product.name}
              className="chatbot-product-img"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="chatbot-product-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d2b48c" strokeWidth="1">
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              background: 'rgba(255,255,255,0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              transform: wishlistAnimating ? 'scale(1.3)' : 'scale(1)',
            }}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill={inWishlist ? '#3d352e' : 'none'} stroke="#3d352e" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </button>

          {/* Out of stock badge */}
          {product.inStock === false && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(0,0,0,0.55)',
              color: '#fff',
              fontSize: '0.55rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textAlign: 'center',
              padding: '3px',
            }}>
              Sold Out
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="chatbot-product-info">
          <div className="chatbot-product-cat">{product.category || product.productType}</div>
          <div className="chatbot-product-name">{product.name}</div>
          <div className="chatbot-product-price">
            ₹{product.price?.toLocaleString('en-IN')}
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="chatbot-product-original">₹{product.originalPrice.toLocaleString('en-IN')}</span>
            )}
          </div>
        </div>
      </Link>

      {/* View Product button */}
      <Link href={productUrl} onClick={onClose} className="chatbot-product-view-btn">
        View Product
      </Link>
    </div>
  );
}
