"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { SUPPORTED_CURRENCIES } from '@/config/currencyConfig';

export default function CurrencySelector() {
  const { currency, setCurrency, isLoading } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) return <div style={{ width: 60, height: 20 }}></div>;

  const currentInfo = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES['INR'];

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', zIndex: 50 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.85rem',
          color: 'inherit',
          padding: '4px 8px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
        aria-label="Select Currency"
        title="Select Currency"
      >
        {currentInfo.code} {currentInfo.symbol}
        <span style={{ fontSize: '0.6rem', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: '2px' }}>▼</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '4px',
          backgroundColor: '#fff',
          border: '1px solid #eee',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderRadius: '4px',
          minWidth: '120px',
          overflow: 'hidden',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
            <button
              key={curr.code}
              onClick={() => {
                setCurrency(curr.code);
                setIsOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 16px',
                background: currency === curr.code ? '#f5f5f5' : 'transparent',
                border: 'none',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                fontSize: '0.85rem',
                color: '#333',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f9f9f9')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = currency === curr.code ? '#f5f5f5' : 'transparent')}
            >
              <span style={{ fontWeight: 500, marginRight: '8px', display: 'inline-block', width: '35px' }}>{curr.code}</span>
              <span style={{ color: '#666' }}>{curr.symbol}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
