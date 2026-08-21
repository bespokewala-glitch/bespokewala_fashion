import React from 'react';
import Header from '@/components/layout/Header';
import dynamic from 'next/dynamic';
import FloatingWhatsApp from '@/components/layout/FloatingWhatsApp';

const Footer = dynamic(() => import('@/components/layout/Footer'));

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
      <FloatingWhatsApp />
    </>
  );
}
