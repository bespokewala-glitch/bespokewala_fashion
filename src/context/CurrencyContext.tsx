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

function getCurrencyFromBrowserLocale(): string {
  try {
    // 1. Try Timezone first (more accurate than language)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') return 'INR';
      if (tz === 'Europe/London') return 'GBP';
      if (tz.startsWith('Australia/')) return 'AUD';
      if (tz.startsWith('America/Toronto') || tz.startsWith('America/Vancouver')) return 'CAD';
      if (tz.startsWith('Asia/Dubai')) return 'AED';
      if (tz === 'Asia/Singapore') return 'SGD';
      // Basic timezone checks for EUR
      if (['Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome', 'Europe/Amsterdam'].includes(tz)) return 'EUR';
    }

    // 2. Fallback to language
    const lang = navigator.language || '';
    if (lang.startsWith('en-IN') || lang.startsWith('hi')) return 'INR';
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
      // ── Step 1: Load cached exchange rates instantly (zero-latency) ───────────
      try {
        const cachedRates = localStorage.getItem(LOCAL_RATES_KEY);
        if (cachedRates) {
          const parsed = JSON.parse(cachedRates);
          if (parsed && isMounted) setRates(parsed);
        }
      } catch (_) { /* ignore */ }

      // ── Step 2: Check user's saved preference ─────────────────────────────────
      const pref = readPref();

      if (pref?.source === 'manual') {
        // User manually selected → respect it, never overwrite
        if (isMounted) {
          setCurrencyState(pref.currency);
          setIsLoading(false);
        }
        // Still refresh exchange rates in background (don't await — fire & forget)
        fetchAndCacheRates(isMounted, setRates);
        return;
      }

      // ── Step 3: For returning 'auto' visitors, apply saved pref immediately ───
      // This prevents the INR flash while geo runs.
      if (pref?.source === 'auto' && isMounted) {
        setCurrencyState(pref.currency);
      }

      // ── Step 4: Run geolocation + exchange rates IN PARALLEL ─────────────────
      // They are independent of each other — no reason to wait sequentially.
      const [geoResult] = await Promise.allSettled([
        (async () => {
          try {
            const controller = new AbortController();
            const geoTimeout = setTimeout(() => controller.abort(), 4000);
            const geoRes = await fetch('/api/geolocation', { signal: controller.signal });
            clearTimeout(geoTimeout);

            if (geoRes.ok && isMounted) {
              const geoData = await geoRes.json();
              
              if (geoData.fallback) {
                // If backend used its default fallback (e.g. API rate limit),
                // throw to use our smarter client-side timezone fallback instead.
                throw new Error('Backend geolocation failed');
              }

              const detectedCurrency = geoData.currency;
              const finalCurrency =
                detectedCurrency && SUPPORTED_CURRENCIES[detectedCurrency]
                  ? detectedCurrency
                  : DEFAULT_FALLBACK_CURRENCY;
              setCurrencyState(finalCurrency);
              writePref({ currency: finalCurrency, source: 'auto' });
            } else {
              throw new Error('Geolocation request failed');
            }
          } catch {
            // Browser locale/timezone fallback
            if (isMounted) {
              const fallbackCurrency = getCurrencyFromBrowserLocale();
              // Overwrite if it was auto (fixes stuck bad cached values)
              if (!pref || pref.source === 'auto') {
                setCurrencyState(fallbackCurrency);
                writePref({ currency: fallbackCurrency, source: 'auto' });
              }
            }
          }
        })(),
        fetchAndCacheRates(isMounted, setRates),
      ]);

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
