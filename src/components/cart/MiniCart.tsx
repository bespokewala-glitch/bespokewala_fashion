"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Trash2, X } from 'lucide-react';
import { trackRemoveFromCart } from '@/lib/gtag';

export default function MiniCart() {
  const { cart, updateQuantity, removeFromCart, cartTotal, cartCount, isMiniCartOpen, closeMiniCart } = useCart();
  const { formatPrice } = useCurrency();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Lock body scroll when mini cart is open
  useEffect(() => {
    if (isMiniCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMiniCartOpen]);

  if (!isMounted) return null;

  return (
    <>
      {/* Backdrop */}
      {isMiniCartOpen && (
        <div 
          onClick={closeMiniCart}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Drawer */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          right: isMiniCartOpen ? 0 : '-100%',
          width: '100%',
          maxWidth: '400px',
          height: '100dvh',
          maxHeight: '100dvh',
          backgroundColor: '#fff',
          zIndex: 10000,
          transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
          fontFamily: '"Jost", "Inter", sans-serif'
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem 1.5rem 0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 400, letterSpacing: '0.05em', margin: 0, textTransform: 'uppercase' }}>MAIN CART</h2>
            <button 
              onClick={closeMiniCart}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#000', padding: 0, display: 'flex', minWidth: '44px', minHeight: '44px', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Close cart"
            >
              <X size={20} strokeWidth={1} />
            </button>
          </div>
          {cart.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#666', borderBottom: '1px solid #eaeaea', paddingBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Product</span>
              <span>Total</span>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', paddingTop: '1rem' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '4rem' }}>
              <p style={{ color: '#666', marginBottom: '2rem' }}>Your cart is currently empty.</p>
              <button 
                onClick={closeMiniCart}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: '#000',
                  color: '#fff',
                  border: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                CONTINUE SHOPPING
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {cart.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '1rem', paddingBottom: '1.5rem' }}>
                  <div style={{ width: '85px', height: '110px', position: 'relative', flexShrink: 0, borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f9f9f9' }}>
                    <OptimizedImage
                      src={item.image}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <Link href={`/products/${item.productSlug}`} onClick={closeMiniCart} style={{ textDecoration: 'none', color: '#000' }}>
                      <h3 style={{ fontSize: '0.85rem', margin: '0 0 0.35rem 0', fontWeight: 400, lineHeight: '1.4' }}>
                        {item.name}
                      </h3>
                    </Link>
                    <div style={{ fontWeight: 400, fontSize: '0.85rem', marginBottom: '0.35rem', color: '#333' }}>
                      {formatPrice(item.price)}
                    </div>
                    {item.size && item.size.toLowerCase() !== 'default' && (
                      <div style={{ fontSize: '0.75rem', color: '#333', marginBottom: '1rem' }}>Size: {item.size}</div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #eaeaea', borderRadius: '4px', backgroundColor: '#fff' }}>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#666', fontSize: '1.1rem', minWidth: '36px', minHeight: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          aria-label="Decrease quantity"
                        >
                          &minus;
                        </button>
                        <span style={{ fontSize: '0.85rem', width: '28px', textAlign: 'center', color: '#333' }}>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#666', fontSize: '1.1rem', minWidth: '36px', minHeight: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          aria-label="Increase quantity"
                        >
                          &#43;
                        </button>
                      </div>
                      
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
                        style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0, display: 'inline-flex', minWidth: '36px', minHeight: '36px', alignItems: 'center', justifyContent: 'center' }}
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ padding: '1.5rem', borderTop: '1px solid #eaeaea', backgroundColor: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: 400 }}>
              <span>Estimated total</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            
            <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '1.25rem', marginTop: 0 }}>
              Taxes, Discounts and shipping calculated at checkout
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link 
                href="/checkout"
                onClick={closeMiniCart}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: '#000',
                  color: '#fff',
                  border: '1px solid #000',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontSize: '0.75rem',
                  textDecoration: 'none'
                }}
              >
                CHECK OUT
              </Link>
              <Link 
                href="/cart"
                onClick={closeMiniCart}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: '#000',
                  color: '#fff',
                  border: '1px solid #000',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontSize: '0.75rem',
                  textDecoration: 'none'
                }}
              >
                VIEW MY CART
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
