import React from 'react';
import Header from '@/components/layout/Header';
import dynamic from 'next/dynamic';
import '../chatbot.css';

const Footer = dynamic(() => import('@/components/layout/Footer'));
import MiniCart from '@/components/cart/MiniCart';
import ChatbotWidget from '@/components/chatbot/ChatbotWidget';

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
      <ChatbotWidget />
    </>
  );
}

// force turbopack reload
