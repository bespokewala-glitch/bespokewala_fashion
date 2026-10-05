/**
 * POST /api/auth/otp/send
 *
 * Request body: { email: string; purpose: 'login' | 'reset-password' }
 *
 * Security:
 *  - Rate-limited per email (3 sends / 10 min) to prevent flooding.
 *  - Also rate-limited per IP.
 *  - Resend cooldown enforced inside createAndStoreOtp (60 s).
 *  - Returns generic success even if the email is not registered,
 *    to prevent account enumeration for the reset-password purpose.
 *  - For login purpose, also generic (user existence not revealed).
 *  - The plain OTP is NEVER logged.
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

const VALID_PURPOSES = new Set(['login', 'reset-password']);

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const { email, purpose } = body ?? {};

    // ── Input validation ──────────────────────────────────────────────────────
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    if (!purpose || !VALID_PURPOSES.has(purpose)) {
      return NextResponse.json({ error: 'Invalid OTP purpose.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.toLowerCase().trim();
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // ── Rate limiting: per-IP ─────────────────────────────────────────────────
    const ipLimit = await checkSingleLimit('auth', `otp-send-ip:${ip}`);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(ipLimit.retryAfterSeconds ?? 60) },
        }
      );
    }

    // ── Rate limiting: per-email ──────────────────────────────────────────────
    const emailLimit = await checkSingleLimit('otp', `otp-send-email:${normalizedEmail}`);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many code requests for this email. Please wait before trying again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(emailLimit.retryAfterSeconds ?? 60) },
        }
      );
    }

    // ── For reset-password: user must exist (still generic response to prevent enumeration) ──
    // For login: we allow any registered email
    await dbConnect();
    const user = await User.findOne({ email: normalizedEmail });

    // Always return a generic success response to prevent account enumeration.
    // If no account exists, we silently skip sending.
    const GENERIC_SUCCESS = NextResponse.json(
      {
        message: `If an account exists for that email, a verification code has been sent.`,
        expiresInMinutes: OTP_CONFIG.expiryMinutes,
      },
      { status: 200 }
    );

    if (!user) {
      // Burn some time to prevent timing-based enumeration
      await new Promise((r) => setTimeout(r, 200 + Math.random() * 100));
      return GENERIC_SUCCESS;
    }

    // Google-only accounts cannot log in with OTP (no password set, direct OAuth flow)
    if (purpose === 'login' && user.provider === 'google' && !user.password) {
      // Still generic
      return GENERIC_SUCCESS;
    }

    // ── Create & store OTP ────────────────────────────────────────────────────
    const result = await createAndStoreOtp(normalizedEmail, purpose);

    // Resend cooldown active
    if ('cooldown' in result) {
      return NextResponse.json(
        {
          error: `Please wait ${result.secondsLeft} seconds before requesting a new code.`,
          cooldownSeconds: result.secondsLeft,
        },
        { status: 429 }
      );
    }

    // ── Send email ────────────────────────────────────────────────────────────
    const { success, error: emailError } = await sendOtpEmail(
      normalizedEmail,
      result.plainOtp,  // plain OTP handed directly to mailer — not stored anywhere else
      purpose,
      OTP_CONFIG.expiryMinutes
    );

    if (!success) {
      return NextResponse.json(
        { error: emailError || 'Could not send verification email. Please try again.' },
        { status: 503 }
      );
    }

    // ── Development convenience: log OTP to console only in dev ──────────────
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[OTP DEV] ${purpose} OTP for ${normalizedEmail}: [REDACTED — check your inbox or MongoDB]`);
      // Uncomment below ONLY locally if you have no working SMTP:
      // console.log(`[OTP DEV] Plain OTP: ${result.plainOtp}`);
    }

    return NextResponse.json(
      {
        message: `Verification code sent to ${normalizedEmail}.`,
        expiresInMinutes: OTP_CONFIG.expiryMinutes,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[otp/send] Error:', err?.message ?? err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

