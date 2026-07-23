import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartClient from '@/components/cart/CartClient';

export default function CartPage() {
  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh', paddingTop: '6rem' }}>
        <CartClient />
      </main>
      <Footer />
    </>
  );
}
