'use client';

import React, { useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from './ChatbotWidget';
import ChatMessageComponent from './ChatMessage';
import QuickActions from '@/components/chatbot/QuickActions';

interface ChatPanelProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  onSend: (text: string) => void;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  { label: '👗 Shop Couture', value: 'Show me couture' },
  { label: '🌸 Shop Lehengas', value: 'Show me lehengas' },
  { label: '👠 Shop Footwear', value: 'Show me footwear' },
  { label: '💍 Shop Jewellery', value: 'Show me jewellery' },
  { label: '✨ Find My Perfect Outfit', value: 'Recommend a perfect outfit' }, // Goes to AI
  { label: '📦 Track My Order', value: 'Where is my order?' },
  { label: '🚚 Shipping Policy', value: 'What is your shipping policy?' },
  { label: '💬 Talk to Support', value: 'Contact support' },
];

export default function ChatPanel({ messages, isLoading, onSend, onClose }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = React.useState('');
  const showQuickActions = messages.length <= 1;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    setInputValue('');
    onSend(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chatbot-panel chatbot-panel-enter" role="dialog" aria-label="Bespokewala Style Concierge">
      {/* Header */}
      <div className="chatbot-header">
        <div className="chatbot-avatar">BW</div>
        <div className="chatbot-header-info">
          <div className="chatbot-header-title">Style Concierge</div>
          <div className="chatbot-header-status">
            <span className="chatbot-status-dot" />
            Bespokewala · Available Now
          </div>
        </div>
        <button className="chatbot-close-btn" onClick={onClose} aria-label="Close chat">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="chatbot-messages">
        {messages.map((msg) => (
          <ChatMessageComponent
            key={msg.id}
            message={msg}
            onQuickReply={onSend}
            onClose={onClose}
          />
        ))}

        {/* Quick actions shown after welcome message */}
        {showQuickActions && messages.length > 0 && (
          <QuickActions actions={QUICK_ACTIONS} onSelect={onSend} />
        )}

        {/* Typing indicator */}
        {isLoading && !messages.find((m) => m.isTyping) && (
          <div className="chatbot-typing">
            <div className="chatbot-msg-avatar">BW</div>
            <div className="chatbot-typing-bubble">
              <span className="chatbot-typing-dot" />
              <span className="chatbot-typing-dot" />
              <span className="chatbot-typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chatbot-input-area">
        <div className="chatbot-input-row">
          <textarea
            ref={inputRef}
            className="chatbot-input"
            placeholder="Ask me anything about our collections…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
            aria-label="Chat message input"
          />
          <button
            className="chatbot-send-btn"
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <div className="chatbot-input-hint">Powered by Bespokewala Style AI</div>
      </div>
    </div>
  );
}

// IDE refresh
