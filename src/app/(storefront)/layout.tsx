import React from 'react';
import Header from '@/components/layout/Header';
import dynamic from 'next/dynamic';

const Footer = dynamic(() => import('@/components/layout/Footer'));
import MiniCart from '@/components/cart/MiniCart';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <MiniCart />
    </>
  );
}
