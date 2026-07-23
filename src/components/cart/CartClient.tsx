"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartClient() {
  const { cart, updateQuantity, removeFromCart, cartTotal } = useCart();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null; // Avoid hydration mismatch

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
    <div style={{ padding: '4rem 4rem 8rem', maxWidth: '1400px', margin: '0 auto', fontFamily: '"Jost", "Inter", sans-serif' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 300, marginBottom: '4rem', letterSpacing: '0.1em', textAlign: 'center' }}>CART</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '4rem' }}>
        {/* Left Side - Cart Items */}
        <div>
          {/* Header */}
          <div style={{ display: 'flex', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '2rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666' }}>
            <div style={{ flex: '3' }}>Product</div>
            <div style={{ flex: '1', textAlign: 'center' }}>Quantity</div>
            <div style={{ flex: '1', textAlign: 'right' }}>Total</div>
          </div>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {cart.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #f5f5f5', paddingBottom: '2rem' }}>
                <div style={{ flex: '3', display: 'flex', gap: '2rem', alignItems: 'center' }}>
                  <img src={item.image} alt={item.name} style={{ width: '120px', height: '160px', objectFit: 'cover' }} />
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 400, margin: '0 0 0.5rem', color: '#111' }}>{item.name}</h3>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>₹{item.price.toLocaleString('en-IN')}</div>
                    {item.size && <div style={{ fontSize: '0.85rem', color: '#888' }}>Size: {item.size}</div>}
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      style={{ background: 'none', border: 'none', color: '#999', fontSize: '0.8rem', padding: 0, marginTop: '1rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div style={{ flex: '1', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', padding: '0.5rem' }}>
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#666', padding: '0 0.5rem' }}>-</button>
                    <span style={{ fontSize: '1rem', width: '2rem', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#666', padding: '0 0.5rem' }}>+</button>
                  </div>
                </div>

                <div style={{ flex: '1', textAlign: 'right', fontSize: '1.1rem', fontWeight: 500 }}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Order Summary */}
        <div style={{ backgroundColor: '#faf8f5', padding: '2.5rem', height: 'fit-content', position: 'sticky', top: '8rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 400, margin: '0 0 2rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Order Summary</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            <span style={{ color: '#555' }}>Subtotal</span>
            <span style={{ fontWeight: 500 }}>₹{cartTotal.toLocaleString('en-IN')}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', fontSize: '0.95rem', borderBottom: '1px solid #ddd', paddingBottom: '2rem' }}>
            <span style={{ color: '#555' }}>Shipping</span>
            <span style={{ color: '#888', fontSize: '0.85rem' }}>Calculated at checkout</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', fontSize: '1.2rem', fontWeight: 500 }}>
            <span>Total</span>
            <span>₹{cartTotal.toLocaleString('en-IN')}</span>
          </div>

          <button style={{
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
          }}>
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
