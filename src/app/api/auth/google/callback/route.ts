import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

const secretKey = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'super-secret-key-for-development-only';
const key = new TextEncoder().encode(secretKey);

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

/**
 * GET /api/auth/google/callback
 *
 * Handles the OAuth 2.0 authorization code flow:
 *  1. Validates the `state` CSRF token against the cookie.
 *  2. Exchanges the `code` for an access token with Google.
 *  3. Fetches the user's verified profile from Google's UserInfo endpoint.
 *  4. Finds an existing account by googleId or email, or creates a new one.
 *  5. Issues our standard JWT + HTTP-only cookies, then redirects.
 */
export async function GET(request: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // Helper for error redirects
  const errorRedirect = (msg: string) =>
    NextResponse.redirect(`${siteUrl}/login?error=${encodeURIComponent(msg)}`);

  if (!clientId || !clientSecret) {
    return errorRedirect('Google OAuth is not configured.');
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const oauthError = searchParams.get('error');

  // User cancelled or Google returned an error
  if (oauthError || !code || !stateParam) {
    return errorRedirect(oauthError || 'Google sign-in was cancelled.');
  }

  // ── 1. Verify CSRF state token ──────────────────────────────────────────────
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieStateMatch = cookieHeader.match(/(?:^|;\s*)oauth_state=([^;]+)/);
  const cookieState = cookieStateMatch ? decodeURIComponent(cookieStateMatch[1]) : null;

  if (!cookieState || cookieState !== stateParam) {
    return errorRedirect('Invalid state. Please try signing in again.');
  }

  let redirectAfter = '/account';
  try {
    const { payload } = await jwtVerify(stateParam, key);
    redirectAfter = (payload.redirectAfter as string) || '/account';
  } catch {
    return errorRedirect('State token expired. Please try signing in again.');
  }

  // ── 2. Exchange code for access token ──────────────────────────────────────
  const callbackUrl = `${siteUrl}/api/auth/google/callback`;
  let googleAccessToken: string;

  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[google-oauth] Token exchange failed:', tokenData);
      return errorRedirect('Failed to verify your Google account. Please try again.');
    }

    googleAccessToken = tokenData.access_token;
  } catch (err) {
    console.error('[google-oauth] Token exchange error:', err);
    return errorRedirect('Network error during Google sign-in. Please try again.');
  }

  // ── 3. Fetch verified user info from Google ────────────────────────────────
  let googleProfile: {
    sub: string;
    email: string;
    email_verified: boolean;
    name: string;
    picture?: string;
  };

  try {
    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    });

    if (!profileRes.ok) {
      console.error('[google-oauth] UserInfo fetch failed:', profileRes.status);
      return errorRedirect('Could not retrieve your Google profile. Please try again.');
    }

    googleProfile = await profileRes.json();
  } catch (err) {
    console.error('[google-oauth] UserInfo error:', err);
    return errorRedirect('Network error fetching your Google profile. Please try again.');
  }

  if (!googleProfile.email_verified) {
    return errorRedirect('Your Google email address is not verified.');
  }

  // ── 4. Find or create the user in our database ────────────────────────────
  try {
    await dbConnect();

    const normalizedEmail = googleProfile.email.toLowerCase().trim();

    // Try to find by googleId first (fastest, exact match)
    let user = await User.findOne({ googleId: googleProfile.sub });

    if (!user) {
      // Try to find by email to link an existing local account
      user = await User.findOne({ email: normalizedEmail });

      if (user) {
        // Account linking: existing local account — attach googleId + set provider to google
        user.googleId = googleProfile.sub;
        // Keep provider as 'local' if they still have a password, otherwise switch
        if (!user.password) {
          user.provider = 'google';
        }
        await user.save();
      } else {
        // New user — create account
        user = await User.create({
          name: googleProfile.name || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          googleId: googleProfile.sub,
          provider: 'google',
          role: 'customer',
        });
      }
    }

    // ── 5. Issue our standard JWT cookies ──────────────────────────────────
    const token = await signToken({
      id: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const destination =
      user.role === 'admin' ? '/dashboard/campaigns' : redirectAfter;

    const response = NextResponse.redirect(`${siteUrl}${destination}`);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    };

    response.cookies.set({ name: 'auth-token', value: token, ...cookieOptions });
    response.cookies.set({ name: 'token', value: token, ...cookieOptions });

    // Clear the temporary CSRF state cookie
    response.cookies.set('oauth_state', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (err) {
    console.error('[google-oauth] DB error:', err);
    return errorRedirect('Account creation failed. Please try again.');
  }
}

