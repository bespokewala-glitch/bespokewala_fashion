/**
 * POST /api/auth/forgot-password
 *
 * Step 1 of the password-reset flow: request an OTP for the given email.
 * Delegates to /api/auth/otp/send internally (same logic, dedicated endpoint
 * makes the flow explicit and allows purpose-specific rate limiting).
 *
 * Always returns a generic 200 to prevent account enumeration.
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { createAndStoreOtp, OTP_CONFIG } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email';
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
    const body = await request.json();
    const { email } = body ?? {};

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.toLowerCase().trim();
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Rate-limit per IP
    const ipLimit = await checkSingleLimit('auth', `forgot-ip:${ip}`);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds ?? 60) } }
      );
    }

    // Rate-limit per email
    const emailLimit = await checkSingleLimit('otp', `otp-send-email:${normalizedEmail}`);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many reset requests for this email. Please wait before trying again.' },
        { status: 429, headers: { 'Retry-After': String(emailLimit.retryAfterSeconds ?? 60) } }
      );
    }

    // Generic response — used below to prevent account enumeration
    const GENERIC_OK = NextResponse.json(
      {
        message: 'If an account with that email exists, a reset code has been sent.',
        expiresInMinutes: OTP_CONFIG.expiryMinutes,
      },
      { status: 200 }
    );

    // Look up user — silently skip if not found
    await dbConnect();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      await new Promise((r) => setTimeout(r, 200 + Math.random() * 100));
      return GENERIC_OK;
    }

    // Google-only accounts have no password to reset
    if (user.provider === 'google' && !user.password) {
      return GENERIC_OK;
    }

    // Create & store OTP
    const result = await createAndStoreOtp(normalizedEmail, 'reset-password');

    if ('cooldown' in result) {
      return NextResponse.json(
        {
          error: `Please wait ${result.secondsLeft} seconds before requesting a new code.`,
          cooldownSeconds: result.secondsLeft,
        },
        { status: 429 }
      );
    }

    // Send email
    const { success, error: emailError } = await sendOtpEmail(
      normalizedEmail,
      result.plainOtp,
      'reset-password',
      OTP_CONFIG.expiryMinutes
    );

    if (!success) {
      return NextResponse.json(
        { error: emailError || 'Could not send reset email. Please try again.' },
        { status: 503 }
      );
    }

    return GENERIC_OK;
  } catch (err: any) {
    console.error('[forgot-password] Error:', err?.message ?? err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

