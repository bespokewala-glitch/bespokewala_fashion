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
      {product.sizes && product.sizes.length > 0 && (
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginTop: '1rem' }}>
        <div style={sectionLabelStyle}>Quantity</div>
        <div style={quantitySelectorStyle}>
          <button style={qtyBtnStyle} onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
          <span style={{ fontSize: '1rem' }}>{quantity}</span>
          <button style={qtyBtnStyle} onClick={() => setQuantity(quantity + 1)}>+</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
        <button style={primaryBtnStyle} onClick={handleAddToCart}>
          {isAdding ? 'Adding...' : 'Add to Cart'}
        </button>
        
        <a 
          href={`https://wa.me/919999999999?text=Hello%20Bespokewala,%20I'm%20interested%20in%20the%20${encodeURIComponent(product.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...primaryBtnStyle,
            backgroundColor: '#25D366',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '0',
            textDecoration: 'none'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.882-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.575-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.98 1.002-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.886-9.885 9.886m8.411-18.297A11.815 11.815 0 0012.052 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="currentColor"/>
          </svg>
          Chat with a Stylist
        </a>
      </div>
    </>
  );
}
