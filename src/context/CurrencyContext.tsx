'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SUPPORTED_CURRENCIES,
  BASE_CURRENCY,
  CurrencyDetail,
  COUNTRY_TO_CURRENCY,
  DEFAULT_FALLBACK_CURRENCY
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
  const [currency, setCurrencyState] = useState<string>(BASE_CURRENCY);
  const [rates, setRates] = useState<Record<string, number>>({ INR: 1 });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch exchange rates and detect country
  useEffect(() => {
    let isMounted = true;

    const initializeCurrency = async () => {
      try {
        // 1. Fetch Exchange Rates
        const ratesRes = await fetch('/api/currency/rates');
        let fetchedRates = { INR: 1 };
        if (ratesRes.ok) {
          const data = await ratesRes.json();
          if (data.rates) {
            fetchedRates = data.rates;
            if (isMounted) setRates(fetchedRates);
          }
        }

        // 2. Determine User's Currency
        const savedCurrency = localStorage.getItem('user_currency');
        if (savedCurrency && SUPPORTED_CURRENCIES[savedCurrency]) {
          if (isMounted) {
            setCurrencyState(savedCurrency);
            setIsLoading(false);
          }
          return;
        }

        // 3. IP Geolocation detection
        try {
          const geoRes = await fetch('https://ipapi.co/json/');
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const countryCode = geoData.country_code; // e.g., 'IN', 'US', 'GB'
            const detectedCurrency = COUNTRY_TO_CURRENCY[countryCode] || DEFAULT_FALLBACK_CURRENCY;
            
            if (SUPPORTED_CURRENCIES[detectedCurrency]) {
              if (isMounted) setCurrencyState(detectedCurrency);
              localStorage.setItem('user_currency', detectedCurrency);
            }
          }
        } catch (geoError) {
          console.error('Geolocation detection failed:', geoError);
          // Defaults to BASE_CURRENCY (INR) automatically
        }
      } catch (error) {
        console.error('Failed to initialize currency:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeCurrency();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSetCurrency = (code: string) => {
    if (SUPPORTED_CURRENCIES[code]) {
      setCurrencyState(code);
      localStorage.setItem('user_currency', code);
    }
  };

  const currentDetail = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES[BASE_CURRENCY];

  const convertPrice = (priceInINR: number) => {
    const numericPrice = typeof priceInINR === 'number' ? priceInINR : parseFloat(priceInINR) || 0;
    const rate = rates[currency] || 1;
    const convertedAmount = numericPrice * rate;
    
    return {
      amount: convertedAmount,
      symbol: currentDetail.symbol,
      currency: currentDetail.code,
    };
  };

  const formatPrice = (priceInINR: number) => {
    const { amount, currency: activeCurrencyCode } = convertPrice(priceInINR);
    
    try {
      return new Intl.NumberFormat(currentDetail.locale, {
        style: 'currency',
        currency: activeCurrencyCode,
        minimumFractionDigits: currentDetail.decimals,
        maximumFractionDigits: currentDetail.decimals,
      }).format(amount);
    } catch (e) {
      // Fallback formatting if Intl fails
      return `${currentDetail.symbol}${amount.toFixed(currentDetail.decimals)}`;
    }
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
