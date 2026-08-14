import { NextResponse } from 'next/server';
import { COUNTRY_TO_CURRENCY, DEFAULT_FALLBACK_CURRENCY } from '@/config/currencyConfig';

const GEO_TIMEOUT_MS = 4000; // 4 seconds

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
    // Pass an empty string so ipapi.co auto-detects the server's public IP.
    const isLocal =
      !clientIp ||
      clientIp === '127.0.0.1' ||
      clientIp === '::1' ||
      clientIp.startsWith('192.168.') ||
      clientIp.startsWith('10.') ||
      clientIp.startsWith('172.');

    const apiUrl = isLocal
      ? 'https://ipapi.co/json/'            // auto-detect calling server's IP
      : `https://ipapi.co/${clientIp}/json/`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(apiUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Bespokewala-ECommerce/1.0' },
        // Next.js server-side cache: re-validate every 24 hours per unique IP
        next: { revalidate: 86400 },
      });
    } finally {
      clearTimeout(timer);
    }

    if (res.ok) {
      const data = await res.json();

      // ipapi.co returns `country_code` (2-letter ISO) or `country`
      const countryCode = (
        data.country_code ||
        data.country ||
        ''
      ).toUpperCase().trim();

      if (countryCode) {
        const mappedCurrency =
          COUNTRY_TO_CURRENCY[countryCode] || DEFAULT_FALLBACK_CURRENCY;

        return NextResponse.json({
          countryCode,
          currency: mappedCurrency,
          ip: isLocal ? 'dev-local' : (clientIp || data.ip || 'unknown'),
          source: isLocal ? 'dev-server-ip' : 'client-ip',
        });
      }
    }
  } catch (error) {
    // Timeout or network error — log and fall through to graceful fallback
    console.warn('[Geolocation] Lookup failed or timed out:', error);
  }

  // ── Graceful fallback: do NOT default to IN so we don't hide real bugs ──────
  // Return null currency so the client falls back via its own locale detection
  return NextResponse.json({
    countryCode: null,
    currency: DEFAULT_FALLBACK_CURRENCY,
    fallback: true,
  });
}
