'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { SUPPORTED_CURRENCIES } from '@/config/currencyConfig';
import { Globe, ChevronDown, Check } from 'lucide-react';

export default function CurrencySelector({ isDarkHeader = false }: { isDarkHeader?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const selectedCurrency = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.INR;

  // Adapt text/icon color based on header state (transparent hero vs solid scroll)
  // isDarkHeader === true  → light (solid white) header → use dark text
  // isDarkHeader === false → transparent hero header   → use white text
  const fgColor = isDarkHeader ? '#1c1c1c' : '#ffffff';

  return (
    <>
      {/* ── Scoped dropdown styles (not color-dependent, so safe as static CSS) ── */}
      <style>{`
        .cs-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          background: #ffffff;
          border: 1px solid #e8e8e8;
          box-shadow: 0 12px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06);
          z-index: 1000;
          min-width: 200px;
          overflow: hidden;
          animation: cs-fade-in 0.15s ease;
        }
        @keyframes cs-fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cs-dropdown-header {
          padding: 10px 14px 8px;
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #aaa;
          border-bottom: 1px solid #f0f0f0;
          font-family: inherit;
        }
        .cs-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 14px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition: background-color 0.12s ease;
        }
        .cs-item:hover {
          background-color: #f9f7f4;
        }
        .cs-item-symbol {
          font-size: 0.88rem;
          font-weight: 500;
          color: #1c1c1c;
          min-width: 22px;
        }
        .cs-item-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .cs-item-code {
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          color: #1c1c1c;
          text-transform: uppercase;
        }
        .cs-item-name {
          font-size: 0.67rem;
          color: #999;
          font-weight: 400;
          letter-spacing: 0.02em;
        }
        .cs-item-check {
          width: 14px;
          flex-shrink: 0;
          color: #1c1c1c;
        }
      `}</style>

      <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>

        {/* ── Trigger button — inline color so it reacts to isDarkHeader prop changes ── */}
        <button
          onClick={() => setIsOpen(prev => !prev)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          title="Select Currency"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            padding: '4px 6px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '0.72rem',
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: fgColor,
            opacity: isOpen ? 1 : 0.9,
            transition: 'opacity 0.15s ease',
            whiteSpace: 'nowrap',
            minHeight: '44px',
            minWidth: '0',
          }}
        >
          <Globe
            size={13}
            strokeWidth={1.75}
            style={{ flexShrink: 0, opacity: 0.75 }}
          />
          {/* Symbol + Code — always visible on both mobile and desktop */}
          <span style={{ color: fgColor, letterSpacing: '0.04em' }}>
            {selectedCurrency.symbol} {selectedCurrency.code}
          </span>
          <ChevronDown
            size={10}
            strokeWidth={2}
            style={{
              flexShrink: 0,
              opacity: 0.6,
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
            }}
          />
        </button>

        {/* ── Dropdown ── */}
        {isOpen && (
          <div className="cs-dropdown" role="listbox" aria-label="Select Currency">
            <div className="cs-dropdown-header">Currency</div>

            {Object.values(SUPPORTED_CURRENCIES).map((item) => {
              const isSelected = item.code === currency;
              return (
                <button
                  key={item.code}
                  role="option"
                  aria-selected={isSelected}
                  className="cs-item"
                  style={{ backgroundColor: isSelected ? '#f5f3ef' : undefined }}
                  onClick={() => {
                    setCurrency(item.code);
                    setIsOpen(false);
                    setHoveredCode(null);
                  }}
                >
                  <span className="cs-item-symbol">{item.symbol}</span>
                  <span className="cs-item-details">
                    <span className="cs-item-code">{item.code}</span>
                    <span className="cs-item-name">{item.name}</span>
                  </span>
                  <span className="cs-item-check">
                    {isSelected && <Check size={13} strokeWidth={2.5} />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
