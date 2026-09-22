import { NextResponse } from 'next/server';
import { BASE_CURRENCY } from '@/config/currencyConfig';

const EXCHANGE_RATE_API = `https://open.er-api.com/v6/latest/${BASE_CURRENCY}`;

export async function GET() {
  try {
    const res = await fetch(EXCHANGE_RATE_API, {
      next: { revalidate: 43200 }, // Cache for 12 hours (43200 seconds)
    });

    if (!res.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await res.json();
    return NextResponse.json({
      base: data.base_code || data.base || BASE_CURRENCY,
      rates: data.rates || { INR: 1 },
    });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // Fallback to 1:1 for INR if external API fails
    return NextResponse.json({
      base: BASE_CURRENCY,
      rates: { INR: 1 },
      error: 'Failed to fetch rates, using fallback',
    }, { status: 200 }); 
  }
}
