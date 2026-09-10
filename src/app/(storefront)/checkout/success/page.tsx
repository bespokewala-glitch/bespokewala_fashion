"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { event as fbEvent } from '@/components/MetaPixel';
import { trackPurchase as trackGA4Purchase } from '@/lib/gtag';

function SuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const router = useRouter();

  useEffect(() => {
    if (!orderId) return;

    // Track Purchase Event
    const trackPurchase = async () => {
      try {
        const res = await fetch(`/api/orders/track/${orderId}`);
        if (res.ok) {
          const order = await res.json();
          const eventId = `purchase_${orderId}`;

          // Meta Pixel Purchase
          fbEvent('Purchase', {
            content_ids: order.items.map((item: any) => item.slug),
            content_type: 'product',
            value: order.total,
            currency: 'INR',
            num_items: order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
          }, { eventID: eventId });

          // GA4 purchase — duplicate guard inside trackGA4Purchase via sessionStorage
          trackGA4Purchase(
            {
              items: order.items,
              total: order.total,
              shipping: order.shipping ?? 0,
              tax: order.tax ?? 0,
              coupon: order.coupon,
            },
            orderId
          );
        }
      } catch (err) {
        console.error('Failed to track purchase', err);
      }
    };

    trackPurchase();
  }, [orderId]);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <CheckCircle size={80} color="#2e7d32" strokeWidth={1} />
      </div>
      
      <h1 style={{ fontSize: '2rem', fontWeight: 300, letterSpacing: '0.1em', marginBottom: '1rem', textTransform: 'uppercase' }}>
        Thank You!
      </h1>
      
      <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: '1.6' }}>
        Your order has been placed successfully. We are processing your luxury items and will send you a confirmation email shortly.
      </p>

      {orderId && (
        <div style={{ backgroundColor: '#f9f9f9', padding: '1.5rem', marginBottom: '3rem', border: '1px solid #eee' }}>
          <span style={{ display: 'block', fontSize: '0.875rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Order Reference
          </span>
          <strong style={{ fontSize: '1.25rem', letterSpacing: '0.05em' }}>#{orderId.substring(orderId.length - 8).toUpperCase()}</strong>
        </div>
      )}

      <Link 
        href="/"
        style={{
          display: 'inline-block',
          padding: '1rem 3rem',
          backgroundColor: '#000',
          color: '#fff',
          textDecoration: 'none',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontSize: '0.9rem',
          transition: 'background-color 0.2s'
        }}
      >
        Return to Home
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <>
            <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>}>
          <SuccessClient />
        </Suspense>
      </main>
          </>
  );
}
