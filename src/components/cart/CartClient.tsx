"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { trackRemoveFromCart } from '@/lib/gtag';

export default function CartClient() {
  const { cart, updateQuantity, removeFromCart, cartTotal } = useCart();
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div style={{ padding: '4rem 4rem 8rem', maxWidth: '1400px', margin: '0 auto' }} className="mobile-px-4 mobile-py-4">
        <style>{`
          @keyframes cart-shimmer-base {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .cart-shimmer-base {
            background: linear-gradient(90deg, #f5f0eb 25%, #ede6df 50%, #f5f0eb 75%);
            background-size: 200% 100%;
            animation: cart-shimmer-base 1.5s infinite;
          }
        `}</style>
        <div className="cart-shimmer-base" style={{ width: '120px', height: '32px', margin: '0 auto 4rem', borderRadius: '2px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '4rem' }} className="mobile-flex-col">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ display: 'flex', gap: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #eee' }}>
                <div className="cart-shimmer-base" style={{ width: '120px', height: '160px', borderRadius: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="cart-shimmer-base" style={{ width: '60%', height: '20px', borderRadius: '2px' }} />
                  <div className="cart-shimmer-base" style={{ width: '30%', height: '16px', borderRadius: '2px' }} />
                  <div className="cart-shimmer-base" style={{ width: '100px', height: '36px', borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ border: '1px solid #eee', padding: '2rem', height: '240px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="cart-shimmer-base" style={{ width: '140px', height: '20px', borderRadius: '2px' }} />
            <div className="cart-shimmer-base" style={{ width: '100%', height: '16px', borderRadius: '2px' }} />
            <div className="cart-shimmer-base" style={{ width: '100%', height: '48px', borderRadius: '2px', marginTop: 'auto' }} />
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '8rem 2rem', minHeight: '60vh' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 300, marginBottom: '2rem', letterSpacing: '0.1em' }}>YOUR CART</h1>
        <p style={{ color: '#666', marginBottom: '3rem' }}>Your cart is currently empty.</p>
        <Link href="/products?productType=couture" style={{
          display: 'inline-block',
          padding: '1rem 3rem',
          backgroundColor: '#000',
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontSize: '0.9rem',
          textDecoration: 'none'
        }}>
          CONTINUE SHOPPING
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '4rem 4rem 8rem', maxWidth: '1400px', margin: '0 auto', fontFamily: '"Jost", "Inter", sans-serif' }} className="mobile-px-4 mobile-py-4">
      <h1 style={{ fontSize: '2rem', fontWeight: 300, marginBottom: '4rem', letterSpacing: '0.1em', textAlign: 'center' }}>CART</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '4rem' }} className="mobile-flex-col">
        {/* Left Side - Cart Items */}
        <div>
          {/* Header */}
          <div style={{ display: 'flex', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '2rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666' }} className="mobile-hide">
            <div style={{ flex: '3' }}>Product</div>
            <div style={{ flex: '1', textAlign: 'center' }}>Quantity</div>
            <div style={{ flex: '1', textAlign: 'right' }}>Total</div>
          </div>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {cart.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #f5f5f5', paddingBottom: '2rem' }} className="mobile-flex-col mobile-gap-md">
                <div style={{ flex: '3', display: 'flex', gap: '2rem', alignItems: 'center' }} className="mobile-w-full">
                  <div style={{ position: 'relative', width: '120px', height: '160px', flexShrink: 0 }}>
                    <OptimizedImage src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} variant="thumbnail" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 400, margin: '0 0 0.5rem', color: '#111' }}>{item.name}</h3>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>{formatPrice(item.price)}</div>
                    {item.size && <div style={{ fontSize: '0.85rem', color: '#888' }}>Size: {item.size}</div>}
                    <button 
                      onClick={() => {
                        trackRemoveFromCart({
                          productSlug: item.productSlug,
                          name: item.name,
                          price: item.price,
                          quantity: item.quantity,
                        });
                        removeFromCart(item.id);
                      }}
                      style={{ background: 'none', border: 'none', color: '#999', fontSize: '0.8rem', padding: '0.5rem 0', marginTop: '0.5rem', cursor: 'pointer', textDecoration: 'underline', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div style={{ flex: '1', display: 'flex', justifyContent: 'center' }} className="mobile-w-full mobile-text-left">
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd' }}>
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#666', minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                    <span style={{ fontSize: '1rem', width: '2rem', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#666', minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                </div>

                <div style={{ flex: '1', textAlign: 'right', fontSize: '1.1rem', fontWeight: 500 }} className="mobile-w-full mobile-text-left">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Order Summary */}
        <div style={{ backgroundColor: '#faf8f5', padding: '2.5rem', height: 'fit-content', position: 'sticky', top: '8rem', width: '100%', boxSizing: 'border-box' }} className="mobile-m-0 mobile-p-4 mobile-static">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 400, margin: '0 0 2rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Order Summary</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            <span style={{ color: '#555' }}>Subtotal</span>
            <span style={{ fontWeight: 500 }}>{formatPrice(cartTotal)}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', fontSize: '0.95rem', borderBottom: '1px solid #ddd', paddingBottom: '2rem' }}>
            <span style={{ color: '#555' }}>Shipping</span>
            <span style={{ color: '#888', fontSize: '0.85rem' }}>Calculated at checkout</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', fontSize: '1.2rem', fontWeight: 500 }}>
            <span>Total</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>

          <button 
            onClick={() => router.push('/checkout')}
            style={{
              width: '100%',
              padding: '1.2rem',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Proceed to Checkout
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: '#888' }}>
            Taxes and shipping calculated at checkout
          </div>
        </div>
      </div>
    </div>
  );
}
