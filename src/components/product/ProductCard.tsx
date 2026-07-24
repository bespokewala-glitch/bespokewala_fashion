import React from 'react';
import Link from 'next/link';

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
  const cardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    cursor: 'pointer',
    position: 'relative',
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
