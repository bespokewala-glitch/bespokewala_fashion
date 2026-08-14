'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  SUPPORTED_CURRENCIES,
  BASE_CURRENCY,
  DEFAULT_FALLBACK_CURRENCY,
  CurrencyDetail,
} from '@/config/currencyConfig';

const LOCAL_STORAGE_KEY = 'bespokewala_user_currency';
const LOCAL_RATES_KEY = 'bespokewala_exchange_rates';

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

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const [currency, setCurrencyState] = useState<string>(BASE_CURRENCY);
  const [rates, setRates] = useState<Record<string, number>>({
    INR: 1,
    USD: 0.012,
    GBP: 0.0094,
    EUR: 0.011,
    CAD: 0.016,
    AUD: 0.018,
    AED: 0.044,
    SGD: 0.016,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize currency & rates
  useEffect(() => {
    let isMounted = true;

    async function initCurrencyAndRates() {
      try {
        // 1. Fetch Exchange Rates first
        const ratesRes = await fetch('/api/exchange-rates');
        if (ratesRes.ok) {
          const ratesData = await ratesRes.json();
          if (ratesData.rates && isMounted) {
            setRates(ratesData.rates);
            try {
              localStorage.setItem(LOCAL_RATES_KEY, JSON.stringify(ratesData.rates));
            } catch (e) {
              /* ignore localStorage errors */
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch exchange rates, using defaults:', err);
      }

      // 2. Determine Currency Preference
      try {
        const savedCurrency = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedCurrency && SUPPORTED_CURRENCIES[savedCurrency]) {
          // User manually selected a currency previously
          if (isMounted) setCurrencyState(savedCurrency);
          if (isMounted) setIsLoading(false);
          return;
        }

        // No saved preference -> Perform IP Geolocation Detection
        const geoRes = await fetch('/api/geolocation');
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          const detectedCurrency = geoData.currency || DEFAULT_FALLBACK_CURRENCY;
          const finalCurrency = SUPPORTED_CURRENCIES[detectedCurrency] ? detectedCurrency : DEFAULT_FALLBACK_CURRENCY;
          
          if (isMounted) {
            setCurrencyState(finalCurrency);
            localStorage.setItem(LOCAL_STORAGE_KEY, finalCurrency);
          }
        }
      } catch (err) {
        console.warn('Geolocation detection failed, using fallback:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initCurrencyAndRates();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update active currency (e.g. from user dropdown selection)
  const handleSetCurrency = (code: string) => {
    if (SUPPORTED_CURRENCIES[code]) {
      setCurrencyState(code);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, code);
      } catch (e) {
        /* ignore */
      }
    }
  };

  // Current active currency metadata
  const currentDetail = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES[BASE_CURRENCY];

  // Helper to convert price from INR base
  const convertPrice = (priceInINR: number) => {
    const numericPrice = typeof priceInINR === 'number' ? priceInINR : parseFloat(priceInINR) || 0;
    const rate = rates[currency] || rates[DEFAULT_FALLBACK_CURRENCY] || 1;
    const convertedAmount = numericPrice * rate;

    return {
      amount: convertedAmount,
      symbol: currentDetail.symbol,
      currency: currentDetail.code,
    };
  };

  // Helper to format price with symbol and locale
  const formatPrice = (priceInINR: number) => {
    const { amount } = convertPrice(priceInINR);

    if (currency === 'INR') {
      return `₹${Math.round(amount).toLocaleString('en-IN')}`;
    }

    const formattedAmount = amount.toLocaleString(currentDetail.locale, {
      minimumFractionDigits: currentDetail.decimals,
      maximumFractionDigits: currentDetail.decimals,
    });

    return `${currentDetail.symbol}${formattedAmount}`;
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

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
