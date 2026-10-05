import { NextResponse } from 'next/server';
import { BASE_CURRENCY } from '@/config/currencyConfig';

const EXCHANGE_RATE_API = `https://open.er-api.com/v6/latest/${BASE_CURRENCY}`;

// Robust fallback rates (approximate baseline INR exchange values)
const DEFAULT_FALLBACK_RATES: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AED: 0.044,
  AUD: 0.018,
  CAD: 0.016,
  SGD: 0.016,
  SAR: 0.045,
  QAR: 0.044,
  KWD: 0.0037,
};

export async function GET() {
  try {
    const res = await fetch(EXCHANGE_RATE_API, {
      next: { revalidate: 43200 }, // Cache for 12 hours (43200 seconds)
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5-second timeout to prevent route hanging
    });

    if (!res.ok) {
      throw new Error(`Exchange rate provider returned status ${res.status}`);
    }

    const data = await res.json();
    const fetchedRates = data.rates || {};

    return NextResponse.json({
      base: data.base_code || data.base || BASE_CURRENCY,
      rates: {
        ...DEFAULT_FALLBACK_RATES,
        ...fetchedRates,
      },
    });
  } catch (error) {
    console.error('[currency/rates] Error fetching exchange rates from provider:', error instanceof Error ? error.message : error);
    // Safe recovery behavior: return baseline rates so international customers can still browse
    return NextResponse.json(
      {
        base: BASE_CURRENCY,
        rates: DEFAULT_FALLBACK_RATES,
        warning: 'Live exchange rates temporarily unavailable; using cached baseline rates.',
      },
      { status: 200 }
    );
  }
}
