export const dynamic = 'force-dynamic';
/**
 * POST /api/auth/otp/verify
 *
 * Verifies an OTP submitted by the user for the 'login' purpose.
 * On success: issues the standard JWT auth cookies and returns user info.
 *
 * Request body: { email: string; otp: string }
 *
 * For password-reset OTP verification, see /api/auth/forgot-password (sends OTP)
 * and /api/auth/reset-password (accepts OTP + new password together).
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { verifyStoredOtp } from '@/lib/otp';
import { signToken } from '@/lib/auth';
import { checkSingleLimit } from '@/lib/media/rateLimit';

function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    // Rate-limit verification attempts per IP
    const ipLimit = await checkSingleLimit('auth', `otp-verify-ip:${ip}`);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(ipLimit.retryAfterSeconds ?? 60) },
        }
      );
    }

    const body = await request.json();
    const { email, otp } = body ?? {};

    // ── Input validation ──────────────────────────────────────────────────────
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    if (!otp || typeof otp !== 'string') {
      return NextResponse.json({ error: 'Verification code is required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    // Sanitize: OTP should only contain digits
    const cleanOtp = otp.trim().replace(/\D/g, '');
    if (cleanOtp.length === 0) {
      return NextResponse.json({ error: 'Invalid verification code format.' }, { status: 400 });
    }

    // ── Verify OTP ────────────────────────────────────────────────────────────
    const result = await verifyStoredOtp(normalizedEmail, 'login', cleanOtp);

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          ...(result.attemptsLeft !== undefined && { attemptsLeft: result.attemptsLeft }),
        },
        { status: result.status ?? 400 }
      );
    }

    // ── Load the user ─────────────────────────────────────────────────────────
    await dbConnect();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Should not happen (we checked on send), but be defensive
      return NextResponse.json(
        { error: 'Account not found. Please register first.' },
        { status: 404 }
      );
    }

    // ── Issue JWT + cookies ───────────────────────────────────────────────────
    const token = await signToken({
      id: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json(
      {
        message: 'Login successful.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    };

    response.cookies.set({ name: 'auth-token', value: token, ...cookieOptions });
    response.cookies.set({ name: 'token', value: token, ...cookieOptions });

    return response;
  } catch (err: any) {
    console.error('[otp/verify] Error:', err?.message ?? err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
