'use client';

/**
 * ChatbotLoader — a Client Component wrapper that lazy-loads ChatbotWidget.
 *
 * Reason: `ssr: false` is only allowed inside Client Components in Next.js 16+
 * (App Router). The storefront layout is a Server Component, so we can't call
 * dynamic(..., { ssr: false }) there directly. This tiny wrapper bridges that gap.
 */

import dynamic from 'next/dynamic';

const ChatbotWidget = dynamic(() => import('@/components/chatbot/ChatbotWidget'), {
  ssr: false,
  loading: () => null,
});

export default function ChatbotLoader() {
  return <ChatbotWidget />;
}
