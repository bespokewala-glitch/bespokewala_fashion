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

// ── Use the global cache so it survives hot-reload in dev and is shared
// across all requests in a single serverless instance ─────────────────────────
interface RateCache { rates: Record<string, number>; timestamp: number }
const globalRef = global as any;
if (!globalRef.__exchangeRateCache) globalRef.__exchangeRateCache = null;

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const FETCH_TIMEOUT_MS = 2000;             // 2s — was 4s

export async function GET() {
  const now = Date.now();
  const cached: RateCache | null = globalRef.__exchangeRateCache;

  // ── Serve from cache if still fresh ─────────────────────────────────────────
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(
      { base: 'INR', rates: cached.rates, cached: true },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=3600',
        },
      }
    );
  }

  // ── Fetch fresh rates ────────────────────────────────────────────────────────
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch('https://open.er-api.com/v6/latest/INR', {
      signal: controller.signal,
      next: { revalidate: 43200 }, // 12 hours
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.rates?.USD) {
        const rates: Record<string, number> = {
          INR: 1,
          USD: data.rates.USD ?? FALLBACK_RATES.USD,
          GBP: data.rates.GBP ?? FALLBACK_RATES.GBP,
          EUR: data.rates.EUR ?? FALLBACK_RATES.EUR,
          CAD: data.rates.CAD ?? FALLBACK_RATES.CAD,
          AUD: data.rates.AUD ?? FALLBACK_RATES.AUD,
          AED: data.rates.AED ?? FALLBACK_RATES.AED,
          SGD: data.rates.SGD ?? FALLBACK_RATES.SGD,
        };
        globalRef.__exchangeRateCache = { rates, timestamp: now };

        return NextResponse.json(
          { base: 'INR', rates, cached: false },
          {
            headers: {
              'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=3600',
            },
          }
        );
      }
    }
  } catch (error) {
    console.warn('[Exchange Rates] Failed to fetch live rates, using fallback:', error);
  }

  // ── Fallback ─────────────────────────────────────────────────────────────────
  const fallbackRates = cached?.rates ?? FALLBACK_RATES;
  return NextResponse.json(
    { base: 'INR', rates: fallbackRates, fallback: true },
    {
      headers: {
        // Short cache on fallback so we retry sooner
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    }
  );
}
