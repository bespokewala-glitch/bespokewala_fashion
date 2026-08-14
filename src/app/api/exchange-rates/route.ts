import { NextResponse } from 'next/server';

// Default static fallback rates relative to 1 INR (approximate baseline)
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

let cachedRates: { rates: Record<string, number>; timestamp: number } | null = null;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export async function GET() {
  const now = Date.now();

  if (cachedRates && now - cachedRates.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      base: 'INR',
      rates: cachedRates.rates,
      cached: true,
    });
  }

  try {
    // Primary free exchange rate API (open.er-api.com)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://open.er-api.com/v6/latest/INR', {
      signal: controller.signal,
      next: { revalidate: 43200 }, // 12 hours
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.rates && data.rates.USD) {
        cachedRates = {
          rates: {
            INR: 1,
            USD: data.rates.USD || FALLBACK_RATES.USD,
            GBP: data.rates.GBP || FALLBACK_RATES.GBP,
            EUR: data.rates.EUR || FALLBACK_RATES.EUR,
            CAD: data.rates.CAD || FALLBACK_RATES.CAD,
            AUD: data.rates.AUD || FALLBACK_RATES.AUD,
            AED: data.rates.AED || FALLBACK_RATES.AED,
            SGD: data.rates.SGD || FALLBACK_RATES.SGD,
          },
          timestamp: now,
        };

        return NextResponse.json({
          base: 'INR',
          rates: cachedRates.rates,
          cached: false,
        });
      }
    }
  } catch (error) {
    console.warn('[Exchange Rates API Warning] Failed to fetch live rates, using fallback rates:', error);
  }

  // Fallback response if external API is unreachable
  return NextResponse.json({
    base: 'INR',
    rates: cachedRates?.rates || FALLBACK_RATES,
    fallback: true,
  });
}
