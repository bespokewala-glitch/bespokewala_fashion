'use client';

import React from 'react';
import Link from 'next/link';
import { ChatMessage as ChatMessageType } from './ChatbotWidget';
import ChatProductCard from './ChatProductCard';
import { SUPPORT_CONTACTS } from '@/lib/chatbot/faqData';

interface ChatMessageProps {
  message: ChatMessageType;
  onQuickReply: (text: string) => void;
}

function formatOrderStatus(status: string): string {
  switch (status) {
    case 'processing': return 'Processing';
    case 'shipped': return 'Shipped';
    case 'delivered': return 'Delivered';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'processing': return 'status-processing';
    case 'shipped': return 'status-shipped';
    case 'delivered': return 'status-delivered';
    case 'cancelled': return 'status-cancelled';
    default: return 'status-processing';
  }
}

// Detect if the AI message suggests contacting support
function needsSupportButtons(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('whatsapp') ||
    lower.includes('support team') ||
    lower.includes('contact us') ||
    lower.includes('+91 75067') ||
    lower.includes('bespokewala@gmail')
  );
}

// Parse markdown-style links [text](url) into React elements
function parseLinks(text: string) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}>
        {match[1]}
      </a>
    );
    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

// Render text with line breaks and links
function RenderText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => (
        <React.Fragment key={i}>
          {parseLinks(line)}
          {i < text.split('\n').length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  );
}

export default function ChatMessage({ message, onQuickReply }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isTyping = message.isTyping;

  if (isTyping) {
    return (
      <div className="chatbot-typing">
        <div className="chatbot-msg-avatar">BW</div>
        <div className="chatbot-typing-bubble">
          <span className="chatbot-typing-dot" />
          <span className="chatbot-typing-dot" />
          <span className="chatbot-typing-dot" />
        </div>
      </div>
    );
  }

  return (
    <div className={`chatbot-msg ${isUser ? 'chatbot-msg-user' : 'chatbot-msg-ai'}`}>
      {/* Avatar — only for AI */}
      {!isUser && <div className="chatbot-msg-avatar">BW</div>}

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Text bubble */}
        {message.text && (
          <div className="chatbot-msg-bubble">
            <RenderText text={message.text} />
          </div>
        )}

        {/* Product cards */}
        {!isUser && message.products && message.products.length > 0 && (
          <div className="chatbot-products-row">
            {message.products.map((product) => (
              <ChatProductCard
                key={product.id}
                product={product}
                onShowSimilar={() => onQuickReply(`Show me similar products to ${product.name}`)}
              />
            ))}
          </div>
        )}

        {/* Order status card */}
        {!isUser && message.orderInfo && (
          <div className="chatbot-order-card">
            <div className="chatbot-order-id">Order #{String(message.orderInfo.id).slice(-8).toUpperCase()}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className={`chatbot-order-status-badge ${getStatusClass(message.orderInfo.orderStatus)}`}>
                {formatOrderStatus(message.orderInfo.orderStatus)}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#888' }}>
                · {message.orderInfo.paymentStatus === 'completed' ? '✓ Paid' : message.orderInfo.paymentStatus}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#5a4e47', marginBottom: '0.4rem' }}>
              {message.orderInfo.itemCount} item{message.orderInfo.itemCount !== 1 ? 's' : ''} · ₹{message.orderInfo.total?.toLocaleString('en-IN')}
              {message.orderInfo.shippingCost === 0 && <span style={{ color: '#4ade80', marginLeft: '0.3rem', fontSize: '0.65rem' }}>· Free Shipping</span>}
            </div>
            {message.orderInfo.shippingCity && (
              <div style={{ fontSize: '0.7rem', color: '#888' }}>
                Shipping to {message.orderInfo.shippingCity}, {message.orderInfo.shippingCountry}
              </div>
            )}
            <Link
              href="/account/orders"
              style={{
                display: 'inline-block',
                marginTop: '0.6rem',
                fontSize: '0.68rem',
                color: '#3d352e',
                textDecoration: 'underline',
                letterSpacing: '0.05em',
              }}
            >
              View Full Order Details →
            </Link>
          </div>
        )}

        {/* Support buttons — shown when AI mentions contacting support */}
        {!isUser && needsSupportButtons(message.text) && (
          <div className="chatbot-support-actions">
            <a
              href={SUPPORT_CONTACTS.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="chatbot-support-btn chatbot-support-whatsapp"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp Us
            </a>
            <a
              href={SUPPORT_CONTACTS.emailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="chatbot-support-btn chatbot-support-email"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              Email Us
            </a>
          </div>
        )}

        {/* Quick reply chips */}
        {!isUser && message.quickReplies && message.quickReplies.length > 0 && (
          <div className="chatbot-quick-actions" style={{ marginTop: '0.5rem' }}>
            {message.quickReplies.map((reply) => (
              <button
                key={reply}
                className="chatbot-quick-btn"
                onClick={() => onQuickReply(reply)}
              >
                {reply}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
