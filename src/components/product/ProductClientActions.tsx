"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import SizeGuide from '@/components/product/SizeGuide';
import { normalizeImageUrl } from '@/lib/imageUrl';
import { getShippingEstimate } from '@/lib/shippingPolicy';
import { event as fbEvent } from '@/components/MetaPixel';
import dynamic from 'next/dynamic';
import { trackAddToCart, trackChatWithStylist, trackSizeSelection } from '@/lib/gtag';

const VirtualTryOnModal = dynamic(() => import('@/components/product/VirtualTryOnModal'), {
  ssr: false,
});

interface ProductClientActionsProps {
  product: {
    slug: string;
    name: string;
    price: number;
    images?: string[];
    colors?: string[];
    sizes?: string[];
    productType?: string;
    category?: string;
    subcategory?: string;
  };
}

export default function ProductClientActions({ product }: ProductClientActionsProps) {
  const { addToCart, openMiniCart, isAuthenticated, isLoaded } = useCart();
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
  const [isVirtualTryOnOpen, setIsVirtualTryOnOpen] = useState(false);

  // Fix hydration mismatch by generating the URL deterministically
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bespokewala.com';
  const productUrl = `${siteUrl}/products/${product.slug}`;
  const isCouture = product.productType?.toLowerCase() === 'couture';
  const whatsappNumber = '91750676986';
  const whatsappMessage = encodeURIComponent(`Hi, I would like to know more about this product.\n\nProduct: ${product.name}\nProduct URL: ${productUrl}`);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  const handleAddToCart = () => {
    setIsAdding(true);
    const cartItem = {
      id: `${product.slug}-${selectedSize || 'default'}`,
      productSlug: product.slug,
      name: product.name,
      price: product.price,
      image: normalizeImageUrl(product.images?.[0] || ''),
      quantity,
      size: selectedSize || undefined,
    };

    if (isLoaded && !isAuthenticated) {
      localStorage.setItem('pending_cart_action', JSON.stringify(cartItem));
      window.location.href = '/login?redirect=/cart';
      return;
    }

    addToCart(cartItem);
    
    // Track AddToCart event (Meta Pixel)
    fbEvent('AddToCart', {
      content_ids: [product.slug],
      content_name: product.name,
      content_type: 'product',
      value: product.price,
      currency: 'INR',
      quantity: quantity
    });

    // GA4 add_to_cart
    trackAddToCart({
      slug: product.slug,
      name: product.name,
      price: product.price,
      category: product.category,
      productType: product.productType,
      quantity,
    });
    
    setTimeout(() => {
      setIsAdding(false);
      openMiniCart();
    }, 100);
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#333',
  };

  const optionBtnStyle: React.CSSProperties = {
    padding: '0.6rem 0.85rem',
    border: '1px solid #ddd',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '0.8rem',
    minWidth: '44px',
    minHeight: '44px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
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

  const secondaryBtnStyle: React.CSSProperties = {
    flex: 1,
    padding: '1rem',
    backgroundColor: 'transparent',
    color: '#000',
    border: '1px solid #000',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontSize: '0.9rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s',
    textDecoration: 'none',
    textAlign: 'center'
  };

  const quantitySelectorStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  };

  const qtyBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '1.25rem',
    cursor: 'pointer',
    color: '#666',
    minWidth: '44px',
    minHeight: '44px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  };

  const shippingEstimate = getShippingEstimate(product.productType, product.category, product.subcategory);

  return (
    <>
      {product.sizes && product.sizes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={sectionLabelStyle}>Size</div>
            <SizeGuide />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {filteredSizes.map((size: string) => (
              <button 
                key={size} 
                onClick={() => {
                  setSelectedSize(size);
                  trackSizeSelection({ slug: product.slug, name: product.name }, size);
                }}
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
          
          {selectedSize === 'Custom' && (
            <div style={{
              marginTop: '0.5rem',
              padding: '1rem',
              background: '#f9f9f9',
              border: '1px solid #eaeaea',
              fontSize: '0.85rem',
              lineHeight: '1.5',
              color: '#555'
            }}>
              <strong>Bespoke Sizing:</strong> Our style concierge will contact you for precise measurements after your order is placed to ensure a perfect fit. 
              <br/><br/>
              Need help before ordering? <Link href="/consultation" style={{ textDecoration: 'underline', color: '#000' }}>Request a Consultation</Link>.
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginTop: '1rem' }}>
        <div style={sectionLabelStyle}>Quantity</div>
        <div style={quantitySelectorStyle}>
          <button style={qtyBtnStyle} onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
          <span style={{ fontSize: '0.85rem', border: '1px solid #ddd', padding: '0.5rem 1rem' }}>{quantity}</span>
          <button style={qtyBtnStyle} onClick={() => setQuantity(quantity + 1)}>+</button>
        </div>
      </div>
      
      <div style={{ fontSize: '0.85rem', color: '#444', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
        <span>Shipping Time: <strong>{shippingEstimate}</strong></span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        
        {/* Secondary Buttons Row */}
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          {isCouture && (
            <button 
              style={secondaryBtnStyle} 
              onClick={() => setIsVirtualTryOnOpen(true)}
            >
              Virtual Try On
            </button>
          )}
          
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={secondaryBtnStyle}
            onClick={() => trackChatWithStylist({
              slug: product.slug,
              name: product.name,
              category: product.category,
              productType: product.productType,
            })}
          >
            Chat with Stylist
          </a>
        </div>

        {/* Primary Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            style={{ ...primaryBtnStyle, marginTop: 0, opacity: (!product.price || product.price === 0) ? 0.5 : (isAdding ? 0.7 : 1), cursor: (!product.price || product.price === 0) ? 'not-allowed' : 'pointer' }} 
            onClick={(!product.price || product.price === 0) ? undefined : handleAddToCart}
            disabled={!product.price || product.price === 0 || isAdding}
          >
            {(!product.price || product.price === 0) ? 'Price Not Configured' : (isAdding ? 'Adding to Bag...' : 'Add to Cart')}
          </button>
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#666' }}>
            Complimentary alterations within 7 days of delivery for bespoke items.
          </div>
        </div>
      </div>

      <VirtualTryOnModal 
        isOpen={isVirtualTryOnOpen} 
        onClose={() => setIsVirtualTryOnOpen(false)} 
        productImage={normalizeImageUrl(product.images?.[0] || '')} 
        productId={product.slug}
        productName={product.name}
        productCategory={product.productType || product.category}
        productPrice={product.price}
      />
    </>
  );
}
