'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { SUPPORTED_CURRENCIES } from '@/config/currencyConfig';
import { Globe, ChevronDown } from 'lucide-react';

export default function CurrencySelector({ isDarkHeader = false }: { isDarkHeader?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCurrency = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.INR;

  const textColor = isDarkHeader ? '#1c1c1c' : 'inherit';

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'none',
          border: '1px solid rgba(180, 180, 180, 0.4)',
          borderRadius: '3px',
          padding: '0.3rem 0.6rem',
          fontSize: '0.75rem',
          fontWeight: 500,
          letterSpacing: '0.05em',
          color: textColor,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        title="Select Currency"
      >
        <Globe size={13} style={{ opacity: 0.8 }} />
        <span>{selectedCurrency.symbol} {selectedCurrency.code}</span>
        <ChevronDown size={12} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            backgroundColor: '#ffffff',
            border: '1px solid #e5e5e5',
            borderRadius: '4px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            zIndex: 1000,
            minWidth: '160px',
            overflow: 'hidden',
            padding: '0.35rem 0',
          }}
        >
          <div style={{ padding: '0.4rem 0.8rem', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', borderBottom: '1px solid #f0f0f0' }}>
            Select Currency
          </div>
          {Object.values(SUPPORTED_CURRENCIES).map((item) => {
            const isSelected = item.code === currency;
            return (
              <button
                key={item.code}
                onClick={() => {
                  setCurrency(item.code);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.8rem',
                  fontSize: '0.78rem',
                  color: isSelected ? '#1c1c1c' : '#555',
                  fontWeight: isSelected ? 600 : 400,
                  backgroundColor: isSelected ? '#f7f5f0' : 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                className="currency-item-hover"
              >
                <span>{item.symbol} {item.code}</span>
                <span style={{ fontSize: '0.7rem', color: '#888', fontWeight: 400 }}>{item.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
