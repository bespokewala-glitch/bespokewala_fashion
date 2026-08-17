'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  SUPPORTED_CURRENCIES,
  BASE_CURRENCY,
  DEFAULT_FALLBACK_CURRENCY,
  CurrencyDetail,
} from '@/config/currencyConfig';

/** 
 * Currency preference stored in localStorage.
 * source === 'manual'  → user explicitly picked this; never auto-overwrite it.
 * source === 'auto'    → detected from IP; can be re-detected on next visit.
 */
interface CurrencyPreference {
  currency: string;
  source: 'manual' | 'auto';
}

const LOCAL_PREF_KEY   = 'bespokewala_currency_pref';   // { currency, source }
const LOCAL_RATES_KEY  = 'bespokewala_exchange_rates';

// ── Fallback rates (INR base) used when exchange-rate API is unreachable ──────
const FALLBACK_RATES: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  GBP: 0.0094,
  EUR: 0.011,
  CAD: 0.016,
  AUD: 0.018,
  AED: 0.044,
  SGD: 0.016,
};

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function readPref(): CurrencyPreference | null {
  try {
    const raw = localStorage.getItem(LOCAL_PREF_KEY);
    if (!raw) return null;
    const parsed: CurrencyPreference = JSON.parse(raw);
    if (parsed.currency && SUPPORTED_CURRENCIES[parsed.currency] && parsed.source) {
      return parsed;
    }
  } catch (_) { /* ignore */ }
  return null;
}

function writePref(pref: CurrencyPreference) {
  try {
    localStorage.setItem(LOCAL_PREF_KEY, JSON.stringify(pref));
  } catch (_) { /* ignore */ }
}

/** Attempt a browser locale fallback when IP detection fails */
function getCurrencyFromBrowserLocale(): string {
  try {
    const lang = navigator.language || '';
    if (lang.startsWith('en-IN')) return 'INR';
    if (lang.startsWith('en-GB')) return 'GBP';
    if (lang.startsWith('en-US')) return 'USD';
    if (lang.startsWith('en-CA')) return 'CAD';
    if (lang.startsWith('en-AU')) return 'AUD';
  } catch (_) { /* ignore */ }
  return DEFAULT_FALLBACK_CURRENCY;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const [currency, setCurrencyState] = useState<string>(BASE_CURRENCY);
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      // ── Step 1: Load cached exchange rates instantly ────────────────────────
      try {
        const cachedRates = localStorage.getItem(LOCAL_RATES_KEY);
        if (cachedRates) {
          const parsed = JSON.parse(cachedRates);
          if (parsed && isMounted) setRates(parsed);
        }
      } catch (_) { /* ignore */ }

      // ── Step 2: Check user's saved preference ───────────────────────────────
      const pref = readPref();

      if (pref?.source === 'manual') {
        // User manually selected → respect it, never overwrite with auto-detection
        if (isMounted) {
          setCurrencyState(pref.currency);
          setIsLoading(false);
        }
        // Still refresh exchange rates in background
        fetchAndCacheRates(isMounted, setRates);
        return;
      }

      // ── Step 3: IP Geolocation for new visitors or auto-detected visits ─────
      try {
        const controller = new AbortController();
        const geoTimeout = setTimeout(() => controller.abort(), 4000); // 4s timeout

        const geoRes = await fetch('/api/geolocation', {
          signal: controller.signal,
        });
        clearTimeout(geoTimeout);

        if (geoRes.ok && isMounted) {
          const geoData = await geoRes.json();
          const detectedCurrency = geoData.currency;
          const finalCurrency =
            detectedCurrency && SUPPORTED_CURRENCIES[detectedCurrency]
              ? detectedCurrency
              : DEFAULT_FALLBACK_CURRENCY;

          setCurrencyState(finalCurrency);
          // Save as 'auto' — will be re-detected next fresh visit (not treated as manual)
          writePref({ currency: finalCurrency, source: 'auto' });
        }
      } catch (err) {
        // ── Step 4: Browser locale fallback ─────────────────────────────────
        if (isMounted) {
          const fallbackCurrency = getCurrencyFromBrowserLocale();
          setCurrencyState(fallbackCurrency);
          writePref({ currency: fallbackCurrency, source: 'auto' });
        }
        console.warn('[CurrencyContext] Geolocation failed, using browser locale fallback:', err);
      }

      // ── Fetch live exchange rates in parallel ───────────────────────────────
      await fetchAndCacheRates(isMounted, setRates);

      if (isMounted) setIsLoading(false);
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Manual selection from dropdown ─────────────────────────────────────────
  const handleSetCurrency = (code: string) => {
    if (SUPPORTED_CURRENCIES[code]) {
      setCurrencyState(code);
      // Save as 'manual' — IP detection will NEVER overwrite this
      writePref({ currency: code, source: 'manual' });
    }
  };

  const currentDetail = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES[BASE_CURRENCY];

  const convertPrice = (priceInINR: number) => {
    const numericPrice = typeof priceInINR === 'number' ? priceInINR : parseFloat(priceInINR) || 0;
    const rate = rates[currency] ?? rates[DEFAULT_FALLBACK_CURRENCY] ?? 1;
    return {
      amount: numericPrice * rate,
      symbol: currentDetail.symbol,
      currency: currentDetail.code,
    };
  };

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

// ── Standalone rate fetcher (runs in background) ──────────────────────────────
async function fetchAndCacheRates(
  isMounted: boolean,
  setRates: React.Dispatch<React.SetStateAction<Record<string, number>>>
) {
  try {
    const ratesRes = await fetch('/api/exchange-rates');
    if (ratesRes.ok) {
      const ratesData = await ratesRes.json();
      if (ratesData.rates) {
        if (isMounted) setRates(ratesData.rates);
        try {
          localStorage.setItem(LOCAL_RATES_KEY, JSON.stringify(ratesData.rates));
        } catch (_) { /* ignore */ }
      }
    }
  } catch (err) {
    console.warn('[CurrencyContext] Failed to fetch exchange rates:', err);
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
