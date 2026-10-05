import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const secretKey = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'super-secret-key-for-development-only';
const key = new TextEncoder().encode(secretKey);

/**
 * GET /api/auth/google
 * Builds the Google OAuth authorization URL and redirects the user to Google.
 * A short-lived `state` JWT (5 min) is generated and stored in a cookie so the
 * callback can verify the request wasn't forged (CSRF protection).
 */
export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (!clientId) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured on this server.' },
      { status: 503 }
    );
  }

  // Capture optional ?redirect= param so we can honour it after login
  const { searchParams } = new URL(request.url);
  const redirectAfter = searchParams.get('redirect') || '/account';

  // Build a signed state JWT: {nonce, redirectAfter} — expires in 5 minutes
  const state = await new SignJWT({ nonce: crypto.randomUUID(), redirectAfter })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(key);

  const callbackUrl = `${siteUrl}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    state,
    // prompt: 'select_account', // Uncomment to always show account picker
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  const response = NextResponse.redirect(googleAuthUrl);

  // Store state in a short-lived, HTTP-only cookie for CSRF verification in callback
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 5, // 5 minutes
  });

  return response;
}

