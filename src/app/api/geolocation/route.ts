import { NextResponse } from 'next/server';
import { COUNTRY_TO_CURRENCY, DEFAULT_FALLBACK_CURRENCY } from '@/config/currencyConfig';

export async function GET(request: Request) {
  try {
    // Extract IP from headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    
    let clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || '';

    // Handle local loopback IP in development
    if (!clientIp || clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.')) {
      // In local dev, fetch server public IP or default to IN
      clientIp = ''; // empty string lets ipapi detect caller public IP
    }

    const apiUrl = clientIp ? `https://ipapi.co/${clientIp}/json/` : `https://ipapi.co/json/`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Bespokewala-ECommerce' },
      next: { revalidate: 86400 } // Cache for 24h
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const countryCode = (data.country_code || data.country || 'IN').toUpperCase();
      const mappedCurrency = COUNTRY_TO_CURRENCY[countryCode] || DEFAULT_FALLBACK_CURRENCY;

      return NextResponse.json({
        countryCode,
        currency: mappedCurrency,
        ip: clientIp || data.ip || 'detected',
      });
    }
  } catch (error) {
    console.warn('[Geolocation API Warning] Geolocation lookup failed or timed out:', error);
  }

  // Graceful fallback if API fails, times out, or rate limits
  return NextResponse.json({
    countryCode: 'IN',
    currency: 'INR',
    fallback: true,
  });
}
