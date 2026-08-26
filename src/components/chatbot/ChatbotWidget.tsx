'use client';

import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

// ── Types ─────────────────────────────────────────────────────────────────
export interface ChatProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  image?: string;
  category?: string;
  productType?: string;
  occasion?: string;
  colors?: string[];
  inStock?: boolean;
  isFeatured?: boolean;
  recommendationReason?: string;
}

export interface ChatOrderInfo {
  id: string;
  orderStatus: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  createdAt: string;
  itemCount: number;
  items: Array<{ name: string; quantity: number; price: number; size?: string; image?: string }>;
  shippingCity?: string;
  shippingCountry?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  products?: ChatProduct[];
  orderInfo?: ChatOrderInfo | null;
  quickReplies?: string[];
  timestamp: Date;
  isTyping?: boolean;
}

export interface PageContext {
  slug?: string;
  name?: string;
  category?: string;
  productType?: string;
  price?: number;
  colors?: string[];
  sizes?: string[];
}

// ── Lazy-load the heavy ChatPanel ─────────────────────────────────────────
const ChatPanel = lazy(() => import('@/components/chatbot/ChatPanel'));

// ── Main Widget ───────────────────────────────────────────────────────────
interface ChatbotWidgetProps {
  pageContext?: PageContext;
}

export default function ChatbotWidget({ pageContext: propPageContext }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [pageContext, setPageContext] = useState<PageContext | undefined>(propPageContext);
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const router = useRouter();

  // Only render on client
  useEffect(() => {
    // Read page context set by ProductChatContext
    if (typeof window !== 'undefined' && window.__bespokewalaPageContext) {
      setPageContext(window.__bespokewalaPageContext);
    }
  }, []);

  // Listen for page context changes (e.g. when navigating to a product page)
  useEffect(() => {
    const handleContextChange = () => {
      if (typeof window !== 'undefined') {
        setPageContext(window.__bespokewalaPageContext);
      }
    };
    window.addEventListener('bespokewala:pagecontext', handleContextChange);
    return () => window.removeEventListener('bespokewala:pagecontext', handleContextChange);
  }, []);

  // Track pages to provide context-awareness
  const conversationRef = useRef<Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>>([]);

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Add to Gemini conversation history
    conversationRef.current.push({ role: 'user', parts: [{ text: userText }] });

    // Add typing indicator
    const typingMsg: ChatMessage = {
      id: 'typing',
      role: 'ai',
      text: '',
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages((prev) => [...prev, typingMsg]);

    try {
      // Build cart context string for the AI
      const cartContext = cart.length > 0
        ? `Cart items: ${cart.map((c) => `${c.name} (x${c.quantity}, ₹${c.price})`).join(', ')}`
        : null;

      const wishlistContext = wishlist.length > 0
        ? `Wishlist items: ${wishlist.map((w) => `${w.name} (₹${w.price})`).join(', ')}`
        : null;

      const contextualMessage = [
        cartContext,
        wishlistContext,
      ].filter(Boolean).join('. ');

      // Keep the user message pure
      conversationRef.current[conversationRef.current.length - 1] = {
        role: 'user',
        parts: [{ text: userText }],
      };

      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationRef.current,
          pageContext,
          userContext: contextualMessage // Send separately
        }),
      });

      const data = await response.json();

      if (data.navigate) {
        // Navigation response
        router.push(data.navigate);
        setIsOpen(false);
        setMessages((prev) => prev.filter((m) => m.id !== 'typing'));
        // Clear history so the next chat starts fresh
        conversationRef.current = [];
        return;
      }

      // Add AI response to history (use clean text without context)
      conversationRef.current[conversationRef.current.length - 1] = {
        role: 'user',
        parts: [{ text: userText }],
      };
      conversationRef.current.push({ role: 'model', parts: [{ text: data.text || '' }] });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: data.text || "I'm sorry, I couldn't generate a response. Please try again.",
        products: data.products || [],
        orderInfo: data.orderInfo || null,
        timestamp: new Date(),
      };

      setMessages((prev) => prev.filter((m) => m.id !== 'typing').concat(aiMsg));
    } catch {
      setMessages((prev) =>
        prev.filter((m) => m.id !== 'typing').concat({
          id: (Date.now() + 1).toString(),
          role: 'ai',
          text: "I apologise — something went wrong. Please try again, or reach us on WhatsApp at +91 75067 67452.",
          timestamp: new Date(),
        })
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, cart, wishlist, pageContext]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
    // Send welcome if first open
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'ai',
          text: "Welcome to Bespokewala. I'm your personal Style Concierge — here to help you discover the perfect ensemble for your occasion, explore our collections, or assist with your order. How may I assist you today?",
          timestamp: new Date(),
        },
      ]);
    }
  };

  // Removed hasMounted check since ChatbotLoader (ssr: false) guarantees client-only rendering
  // console.log("ChatbotWidget rendered! isOpen:", isOpen);
  
  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          className="chatbot-trigger"
          onClick={handleOpen}
          aria-label="Open Style Concierge"
          id="chatbot-trigger-btn"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#3d352e',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 24px rgba(61,53,46,0.35)',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {hasUnread && <span className="chatbot-badge" aria-hidden="true" style={{ position: 'absolute', top: 0, right: 0, width: '12px', height: '12px', backgroundColor: '#d4af37', borderRadius: '50%' }} />}
          <svg className="chatbot-trigger-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
        </button>
      )}

      {/* Chat Panel — lazy loaded */}
      {isOpen && (
        <Suspense fallback={null}>
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            onSend={sendMessage}
            onClose={() => setIsOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}

// IDE refresh
