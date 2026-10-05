import React from 'react';
import Header from '@/components/layout/Header';
import dynamic from 'next/dynamic';
import '../chatbot.css';

const Footer = dynamic(() => import('@/components/layout/Footer'));
import MiniCart from '@/components/cart/MiniCart';
import ChatbotLoader from '@/components/chatbot/ChatbotLoader';

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
      <ChatbotLoader />
    </>
  );
}

// force turbopack reload
