import { NextResponse } from 'next/server';
import { COUNTRY_TO_CURRENCY, DEFAULT_FALLBACK_CURRENCY } from '@/config/currencyConfig';
import { getOrFetch } from '@/lib/serverCache';

const GEO_TIMEOUT_MS = 2500; // Reduced from 4s → 2.5s for faster fallback

export async function GET(request: Request) {
  try {
    // ── Extract client IP from request headers ────────────────────────────────
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp       = request.headers.get('x-real-ip');
    const cfIp         = request.headers.get('cf-connecting-ip'); // Cloudflare

    let clientIp =
      cfIp?.trim() ||
      (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
      realIp?.trim() ||
      '';

    // In local development, loopback / private IPs can't be geo-located.
    const isLocal =
      !clientIp ||
      clientIp === '127.0.0.1' ||
      clientIp === '::1' ||
      clientIp.startsWith('192.168.') ||
      clientIp.startsWith('10.') ||
      clientIp.startsWith('172.');

    // ── Cache key: 'dev-local' for localhost, otherwise the client IP ─────────
    // TTL: 24 hours — IP→country mapping is stable enough
    const cacheKey = `geo:${isLocal ? 'dev-local' : clientIp}`;

    const result = await getOrFetch(cacheKey, 86400, async () => {
      const apiUrl = isLocal
        ? 'https://ipapi.co/json/'
        : `https://ipapi.co/${clientIp}/json/`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);

      try {
        const res = await fetch(apiUrl, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Bespokewala-ECommerce/1.0' },
          next: { revalidate: 86400 },
        });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          const countryCode = (
            data.country_code ||
            data.country ||
            ''
          ).toUpperCase().trim();

          if (countryCode) {
            const mappedCurrency =
              COUNTRY_TO_CURRENCY[countryCode] || DEFAULT_FALLBACK_CURRENCY;
            return {
              countryCode,
              currency: mappedCurrency,
              ip: isLocal ? 'dev-local' : (clientIp || data.ip || 'unknown'),
              source: isLocal ? 'dev-server-ip' : 'client-ip',
              fallback: false,
            };
          }
        }
      } catch {
        clearTimeout(timer);
        console.warn('[Geolocation] Lookup failed or timed out');
      }

      // Fallback stored in cache too — avoids hammering a down API
      return {
        countryCode: null,
        currency: DEFAULT_FALLBACK_CURRENCY,
        fallback: true,
      };
    });

    return NextResponse.json(result, {
      headers: {
        // Edge-cacheable: same IP → same country. Stale-while-revalidate lets
        // the CDN serve the cached response while refreshing in the background.
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.warn('[Geolocation] Unhandled error:', error);
    return NextResponse.json(
      { countryCode: null, currency: DEFAULT_FALLBACK_CURRENCY, fallback: true },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
