"use client";

import React, { useState } from 'react';
import { useCart, CartItem } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

export default function CheckoutClient() {
  const { cart, cartTotal, clearCart } = useCart();
  const router = useRouter();

  const [shippingDetails, setShippingDetails] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = cartTotal;
  const shippingCost = subtotal > 10000 ? 0 : 500; // Free shipping over 10k
  const total = subtotal + shippingCost;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingDetails(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError("Your cart is empty");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item: CartItem) => ({
            productSlug: item.productSlug,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            size: item.size
          })),
          shippingDetails,
          subtotal,
          shippingCost,
          total,
          paymentMethod: 'card'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to place order');
      }

      clearCart();
      router.push(`/checkout/success?orderId=${data.orderId}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 300, marginBottom: '1rem', letterSpacing: '0.1em' }}>Your Cart is Empty</h2>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Add some items to proceed to checkout.</p>
        <button 
          onClick={() => router.push('/products')}
          style={{
            padding: '1rem 3rem',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '1rem',
    border: '1px solid #e0e0e0',
    backgroundColor: '#fafafa',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 300, letterSpacing: '0.1em', marginBottom: '3rem', textTransform: 'uppercase', textAlign: 'center' }}>
        Checkout
      </h1>

      {error && (
        <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '4rem', alignItems: 'start' }}>
        {/* Shipping Form */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 400, letterSpacing: '0.1em', marginBottom: '2rem', textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
            Shipping Details
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <input required type="text" name="firstName" placeholder="First Name" value={shippingDetails.firstName} onChange={handleChange} style={inputStyle} />
            <input required type="text" name="lastName" placeholder="Last Name" value={shippingDetails.lastName} onChange={handleChange} style={inputStyle} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <input required type="text" name="address" placeholder="Address (Street, Apartment, Suite)" value={shippingDetails.address} onChange={handleChange} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <input required type="text" name="city" placeholder="City" value={shippingDetails.city} onChange={handleChange} style={inputStyle} />
            <input required type="text" name="state" placeholder="State / Province" value={shippingDetails.state} onChange={handleChange} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <input required type="text" name="zipCode" placeholder="Postal Code / ZIP" value={shippingDetails.zipCode} onChange={handleChange} style={inputStyle} />
            <select name="country" value={shippingDetails.country} onChange={handleChange} style={inputStyle}>
              <option value="India">India</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Australia">Australia</option>
              <option value="Canada">Canada</option>
            </select>
          </div>

          <div style={{ marginBottom: '3rem' }}>
            <input required type="tel" name="phone" placeholder="Phone Number" value={shippingDetails.phone} onChange={handleChange} style={inputStyle} />
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 400, letterSpacing: '0.1em', marginBottom: '2rem', textTransform: 'uppercase', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
            Payment Method
          </h2>

          <div style={{ padding: '2rem', border: '1px solid #e0e0e0', backgroundColor: '#fafafa', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <input type="radio" id="card" name="payment" defaultChecked style={{ accentColor: '#000' }} />
              <label htmlFor="card" style={{ fontSize: '1rem', letterSpacing: '0.05em' }}>Credit / Debit Card</label>
            </div>
            <p style={{ color: '#666', fontSize: '0.875rem', marginLeft: '2rem' }}>
              This is a simulated checkout. No real payment will be processed.
            </p>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" placeholder="Card Number (Dummy)" style={inputStyle} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <input type="text" placeholder="MM/YY" style={inputStyle} />
                <input type="text" placeholder="CVC" style={inputStyle} />
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div style={{ backgroundColor: '#f9f9f9', padding: '2.5rem', position: 'sticky', top: '100px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 400, letterSpacing: '0.1em', marginBottom: '2rem', textTransform: 'uppercase' }}>
            Order Summary
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
            {cart.map((item: CartItem, idx: number) => (
              <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '60px', height: '80px', flexShrink: 0, backgroundColor: '#eee' }}>
                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 400, margin: 0 }}>{item.name}</h4>
                  {item.size && <span style={{ fontSize: '0.8rem', color: '#666' }}>Size: {item.size}</span>}
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>Qty: {item.quantity}</div>
                </div>
                <div style={{ fontSize: '0.875rem' }}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.9rem' }}>
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.9rem' }}>
              <span>Shipping</span>
              <span>{shippingCost === 0 ? 'Free' : `₹${shippingCost.toLocaleString('en-IN')}`}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 400 }}>
            <span>Total</span>
            <span>₹{total.toLocaleString('en-IN')}</span>
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1.2rem',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            {loading ? 'Processing...' : 'Place Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
