import React from 'react';
import CartClient from '@/components/cart/CartClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cart',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartPage() {
  return (
    <>
            <main className="cart-page-main" style={{ minHeight: '80vh', paddingTop: '6rem' }}>
        <CartClient />
      </main>
          </>
  );
}
