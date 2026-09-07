'use client';

import React, { createContext, useContext, useState } from 'react';
import {
  SUPPORTED_CURRENCIES,
  BASE_CURRENCY,
  CurrencyDetail,
} from '@/config/currencyConfig';

interface CurrencyContextType {
  currency: string;
  currencyDetail: CurrencyDetail;
  rates: Record<string, number>;
  isLoading: boolean;
  setCurrency: (code: string) => void;
  formatPrice: (priceInINR: number) => string;
  convertPrice: (priceInINR: number) => { amount: number; symbol: string; currency: string };
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  // Hardcoded to INR
  const [currency] = useState<string>(BASE_CURRENCY);
  const [rates] = useState<Record<string, number>>({ INR: 1 });
  const [isLoading] = useState<boolean>(false);

  const handleSetCurrency = (code: string) => {
    // No-op. Site is strictly INR.
  };

  const currentDetail = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES[BASE_CURRENCY];

  const convertPrice = (priceInINR: number) => {
    const numericPrice = typeof priceInINR === 'number' ? priceInINR : parseFloat(priceInINR) || 0;
    return {
      amount: numericPrice,
      symbol: currentDetail.symbol,
      currency: currentDetail.code,
    };
  };

  const formatPrice = (priceInINR: number) => {
    const { amount } = convertPrice(priceInINR);
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyDetail: currentDetail,
        rates,
        isLoading,
        setCurrency: handleSetCurrency,
        formatPrice,
        convertPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
