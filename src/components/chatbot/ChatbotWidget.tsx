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
        >
          {hasUnread && <span className="chatbot-badge" aria-hidden="true" />}
          <div className="chatbot-trigger-logo">BW</div>
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
