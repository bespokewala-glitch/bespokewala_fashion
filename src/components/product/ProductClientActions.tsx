"use client";

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import VirtualTryOnButton from '@/components/product/VirtualTryOnButton';
import SizeGuide from '@/components/product/SizeGuide';

interface ProductClientActionsProps {
  product: {
    slug: string;
    name: string;
    price: number;
    images?: string[];
    colors?: string[];
    sizes?: string[];
  };
}

export default function ProductClientActions({ product }: ProductClientActionsProps) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(product.sizes?.[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart({
      id: `${product.slug}-${selectedSize || 'default'}`,
      productSlug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
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
      {product.sizes && product.sizes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={sectionLabelStyle}>Size</div>
            <SizeGuide />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {product.sizes.map((size: string) => (
              <button 
                key={size} 
                onClick={() => setSelectedSize(size)}
                style={selectedSize === size ? activeOptionBtnStyle : optionBtnStyle}
              >
                {size}
              </button>
            ))}
            <button style={optionBtnStyle}>CUSTOM SIZE</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginTop: '1rem' }}>
        <div style={sectionLabelStyle}>Quantity</div>
        <div style={quantitySelectorStyle}>
          <button style={qtyBtnStyle} onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
          <span style={{ fontSize: '1rem' }}>{quantity}</span>
          <button style={qtyBtnStyle} onClick={() => setQuantity(quantity + 1)}>+</button>
        </div>
      </div>

      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '1rem' }}>
        Made to order: 8-10 weeks
      </div>

      <VirtualTryOnButton garmentImageUrl={product.images?.[0] || ''} />
      <button style={primaryBtnStyle} onClick={handleAddToCart}>
        {isAdding ? 'Adding...' : 'Add to Cart'}
      </button>
    </>
  );
}
