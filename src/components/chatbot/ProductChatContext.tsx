'use client';

/**
 * ProductChatContext — injects product context into the global chatbot.
 * This is a zero-render client component that signals to ChatbotWidget
 * which product the user is currently viewing.
 * 
 * Uses a simple window-level event so the dynamically-loaded ChatbotWidget
 * can pick it up without prop drilling through the server component tree.
 */

import { useEffect } from 'react';
import { PageContext } from '@/components/chatbot/ChatbotWidget';

interface ProductChatContextProps {
  context: PageContext;
}

// Global reference so ChatbotWidget can read it
declare global {
  interface Window {
    __bespokewalaPageContext?: PageContext;
  }
}

export default function ProductChatContext({ context }: ProductChatContextProps) {
  useEffect(() => {
    // Set the global page context so ChatbotWidget can read it
    window.__bespokewalaPageContext = context;
    // Notify the chatbot widget that context has changed
    window.dispatchEvent(new Event('bespokewala:pagecontext'));

    return () => {
      // Clean up when navigating away from the product page
      delete window.__bespokewalaPageContext;
      window.dispatchEvent(new Event('bespokewala:pagecontext'));
    };
  }, [context]);

  return null; // Renders nothing
}
