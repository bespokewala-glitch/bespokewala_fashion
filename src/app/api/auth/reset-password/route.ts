/**
 * POST /api/auth/reset-password
 *
 * Step 2 of the password-reset flow: verify OTP + set new password atomically.
 *
 * Request body: { email: string; otp: string; password: string }
 *
 * Security improvements over old version:
 *  - OTP verification required (old version had no OTP gate at all).
 *  - OTP is single-use and expires (delegated to verifyStoredOtp).
 *  - Rate-limited per IP.
 *  - Input sanitized and validated.
 *  - Password hashed with bcrypt.
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { verifyStoredOtp } from '@/lib/otp';
import { hashPassword } from '@/lib/auth';
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

    // Rate-limit per IP
    const ipLimit = await checkSingleLimit('auth', `auth-reset:${ip}`);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(ipLimit.retryAfterSeconds ?? 60) },
        }
      );
    }

    await dbConnect();
    const body = await request.json();
    const { email, otp, password } = body ?? {};

    // ── Input validation ──────────────────────────────────────────────────────
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    if (!otp || typeof otp !== 'string') {
      return NextResponse.json({ error: 'Verification code is required.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'New password is required.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.trim().replace(/\D/g, '');

    // ── Verify OTP (handles expiry, attempts, single-use) ─────────────────────
    const otpResult = await verifyStoredOtp(normalizedEmail, 'reset-password', cleanOtp);

    if (!otpResult.ok) {
      return NextResponse.json(
        {
          error: otpResult.error,
          ...(otpResult.attemptsLeft !== undefined && { attemptsLeft: otpResult.attemptsLeft }),
        },
        { status: otpResult.status ?? 400 }
      );
    }

    // ── Find user and update password ─────────────────────────────────────────
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address.' },
        { status: 404 }
      );
    }

    user.password = await hashPassword(password);
    // If this was a Google-only account that now sets a password, mark as local too
    if (user.provider === 'google') {
      user.provider = 'local';
    }
    await user.save();

    return NextResponse.json(
      { message: 'Password reset successfully. You can now sign in.' },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[reset-password] Error:', err?.message ?? err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

