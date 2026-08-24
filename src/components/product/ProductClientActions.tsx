"use client";

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import SizeGuide from '@/components/product/SizeGuide';
import { normalizeImageUrl } from '@/lib/imageUrl';

interface ProductClientActionsProps {
  product: {
    slug: string;
    name: string;
    price: number;
    images?: string[];
    colors?: string[];
    sizes?: string[];
    productType?: string;
  };
}

export default function ProductClientActions({ product }: ProductClientActionsProps) {
  const { addToCart } = useCart();
  const SIZES_ORDER = [
    'EU 35', 'EU 35½', 'EU 36', 'EU 36½', 'EU 37', 'EU 37½', 'EU 38', 'EU 38½', 'EU 39', 'EU 39½', 'EU 40', 'EU 40½', 'EU 41', 'EU 41½', 'EU 42', 'EU 42½', 'EU 43', 'EU 44', 'EU 45',
    'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'
  ];
  
  const sortedSizes = [...(product.sizes || [])].sort((a, b) => {
    const indexA = SIZES_ORDER.indexOf(a);
    const indexB = SIZES_ORDER.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  const filteredSizes = sortedSizes.filter(size => size.toLowerCase() !== 'custom');

  const [selectedSize, setSelectedSize] = useState<string | null>(filteredSizes[0] || 'Custom');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart({
      id: `${product.slug}-${selectedSize || 'default'}`,
      productSlug: product.slug,
      name: product.name,
      price: product.price,
      image: normalizeImageUrl(product.images?.[0] || ''),
      quantity,
      size: selectedSize || undefined,
    });
    
    setTimeout(() => {
      setIsAdding(false);
    }, 500);
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#333',
  };

  const optionBtnStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    border: '1px solid #ddd',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '0.85rem',
    minWidth: '3rem',
    textAlign: 'center',
    transition: 'all 0.2s',
  };

  const activeOptionBtnStyle: React.CSSProperties = {
    ...optionBtnStyle,
    backgroundColor: '#000',
    color: '#fff',
    borderColor: '#000',
  };

  const primaryBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '1rem',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginTop: '1rem',
    opacity: isAdding ? 0.7 : 1,
    transition: 'opacity 0.2s',
  };

  const quantitySelectorStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  };

  const qtyBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    color: '#666',
  };

  return (
    <>
      {product.productType?.toLowerCase() !== 'jewellery' && product.sizes && product.sizes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={sectionLabelStyle}>Size</div>
            <SizeGuide />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {filteredSizes.map((size: string) => (
              <button 
                key={size} 
                onClick={() => setSelectedSize(size)}
                style={selectedSize === size ? activeOptionBtnStyle : optionBtnStyle}
              >
                {size}
              </button>
            ))}
            <button 
              onClick={() => setSelectedSize('Custom')}
              style={selectedSize === 'Custom' ? activeOptionBtnStyle : optionBtnStyle}
            >
              CUSTOM SIZE
            </button>
          </div>
        </div>
      )}

      {product.productType?.toLowerCase() !== 'jewellery' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginTop: '1rem' }}>
          <div style={sectionLabelStyle}>Quantity</div>
          <div style={quantitySelectorStyle}>
            <button style={qtyBtnStyle} onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
            <span style={{ fontSize: '1rem' }}>{quantity}</span>
            <button style={qtyBtnStyle} onClick={() => setQuantity(quantity + 1)}>+</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
        {product.productType?.toLowerCase() !== 'jewellery' ? (
          <button style={primaryBtnStyle} onClick={handleAddToCart}>
            {isAdding ? 'Adding...' : 'Add to Cart'}
          </button>
        ) : (
          <a 
            href={`https://wa.me/919999999999?text=Hello%20Bespokewala,%20I'm%20interested%20in%20the%20${encodeURIComponent(product.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...primaryBtnStyle,
              backgroundColor: '#000',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '0',
              textDecoration: 'none',
              textTransform: 'uppercase'
            }}
          >
            Ask for Price
          </a>
        )}
      </div>
    </>
  );
}
