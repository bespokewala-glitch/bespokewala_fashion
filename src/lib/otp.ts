/**
 * otp.ts — Secure OTP generation, storage, and verification.
 *
 * Security properties:
 *  - OTP is generated with crypto.randomInt (cryptographically secure CSPRNG).
 *  - Only a bcrypt hash is stored — the plain OTP is never persisted.
 *  - Single-use: mark `used=true` immediately on successful verification.
 *  - Max attempts: lock after MAX_ATTEMPTS failed verifications.
 *  - Resend cooldown: reject resend requests within RESEND_COOLDOWN_SECONDS.
 *  - Short TTL: OTPs auto-expire via MongoDB TTL index.
 *  - Purpose isolation: login OTPs cannot be used for password reset (and vice versa).
 *  - OTP is NEVER logged in production (callers must honour this).
 */

import bcrypt from 'bcryptjs';
import type { OtpPurpose } from '@/models/Otp';

// ─── Configuration ─────────────────────────────────────────────────────────────
export const OTP_CONFIG = {
  /** Digits in the OTP */
  length: 6,
  /** Minutes before the OTP expires */
  expiryMinutes: 10,
  /** Maximum wrong-attempt retries before the OTP is locked */
  maxAttempts: 5,
  /** Seconds a user must wait before requesting a new OTP */
  resendCooldownSeconds: 60,
  /** bcrypt rounds — 10 is a good balance for short-lived codes */
  bcryptRounds: 10,
} as const;

// ─── OTP Generation ───────────────────────────────────────────────────────────

/**
 * Generate a cryptographically secure N-digit numeric OTP.
 * Uses crypto.randomInt which is CSPRNG-backed (not Math.random).
 */
export function generateOtp(): string {
  const max = 10 ** OTP_CONFIG.length; // 1_000_000 for 6 digits
  const value = crypto.getRandomValues(new Uint32Array(1))[0] % max;
  return String(value).padStart(OTP_CONFIG.length, '0');
}

/**
 * Hash the plain OTP with bcrypt for safe storage.
 * NEVER store the return value anywhere user-facing.
 */
export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, OTP_CONFIG.bcryptRounds);
}

/**
 * Compare a plain OTP attempt against a stored bcrypt hash.
 */
export async function verifyOtpHash(
  plainOtp: string,
  hashedOtp: string
): Promise<boolean> {
  return bcrypt.compare(plainOtp, hashedOtp);
}

// ─── Lifecycle helpers ────────────────────────────────────────────────────────

/**
 * Calculate the absolute expiry Date for a new OTP.
 */
export function otpExpiresAt(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + OTP_CONFIG.expiryMinutes);
  return d;
}

/**
 * Returns true if a resend is still within the cooldown window.
 */
export function isResendCooldownActive(lastSentAt: Date): boolean {
  const elapsedSeconds = (Date.now() - lastSentAt.getTime()) / 1000;
  return elapsedSeconds < OTP_CONFIG.resendCooldownSeconds;
}

/**
 * Returns remaining resend cooldown in seconds (0 if no cooldown).
 */
export function resendCooldownRemaining(lastSentAt: Date): number {
  const elapsed = (Date.now() - lastSentAt.getTime()) / 1000;
  return Math.max(0, Math.ceil(OTP_CONFIG.resendCooldownSeconds - elapsed));
}

// ─── DB Operations (thin wrappers — keep DB imports out of route files) ───────

import dbConnect from '@/lib/mongoose';
import OtpModel from '@/models/Otp';

export interface OtpSendResult {
  /** The plain-text OTP to be emailed — MUST NOT be logged in production */
  plainOtp: string;
  resendCooldownSeconds?: number;
}

export interface OtpVerifyResult {
  ok: boolean;
  /** Human-readable error for the client */
  error?: string;
  /** HTTP status code to return */
  status?: number;
  /** Remaining attempts before lockout */
  attemptsLeft?: number;
}

/**
 * Create (or replace) an OTP document for the given email + purpose.
 * Enforces the resend cooldown — throws with a user-friendly message if active.
 *
 * Returns the plain OTP so the caller can email it.
 * NEVER store or log this value beyond the email dispatch.
 */
export async function createAndStoreOtp(
  email: string,
  purpose: OtpPurpose
): Promise<OtpSendResult | { cooldown: true; secondsLeft: number }> {
  await dbConnect();
  const normalizedEmail = email.toLowerCase().trim();

  // Check for existing unexpired record — enforce resend cooldown
  const existing = await OtpModel.findOne({
    email: normalizedEmail,
    purpose,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (existing && isResendCooldownActive(existing.lastSentAt)) {
    return {
      cooldown: true,
      secondsLeft: resendCooldownRemaining(existing.lastSentAt),
    };
  }

  // Generate fresh OTP
  const plainOtp = generateOtp();
  const hashedOtp = await hashOtp(plainOtp);
  const expiresAt = otpExpiresAt();

  // Upsert: replace any existing OTP for this email+purpose
  await OtpModel.findOneAndReplace(
    { email: normalizedEmail, purpose },
    {
      email: normalizedEmail,
      purpose,
      hashedOtp,
      attempts: 0,
      used: false,
      lastSentAt: new Date(),
      expiresAt,
    },
    { upsert: true, new: true }
  );

  return { plainOtp };
}

/**
 * Verify a submitted OTP for the given email + purpose.
 *
 * On success: marks the OTP as used (single-use) and returns ok: true.
 * On failure: increments attempt counter; returns ok: false with error details.
 */
export async function verifyStoredOtp(
  email: string,
  purpose: OtpPurpose,
  submittedOtp: string
): Promise<OtpVerifyResult> {
  await dbConnect();
  const normalizedEmail = email.toLowerCase().trim();

  const record = await OtpModel.findOne({
    email: normalizedEmail,
    purpose,
  });

  // No OTP on file at all
  if (!record) {
    return {
      ok: false,
      error: 'No verification code found. Please request a new one.',
      status: 400,
    };
  }

  // Already used
  if (record.used) {
    return {
      ok: false,
      error: 'This code has already been used. Please request a new one.',
      status: 400,
    };
  }

  // Expired (belt-and-suspenders — MongoDB TTL may already have deleted it)
  if (record.expiresAt < new Date()) {
    return {
      ok: false,
      error: 'Your code has expired. Please request a new one.',
      status: 400,
    };
  }

  // Max attempts exceeded
  if (record.attempts >= OTP_CONFIG.maxAttempts) {
    return {
      ok: false,
      error: `Too many incorrect attempts. Please request a new code.`,
      status: 429,
    };
  }

  // Verify the hash
  const isValid = await verifyOtpHash(submittedOtp, record.hashedOtp);

  if (!isValid) {
    // Increment attempt counter
    record.attempts += 1;
    await record.save();

    const attemptsLeft = OTP_CONFIG.maxAttempts - record.attempts;

    if (attemptsLeft <= 0) {
      return {
        ok: false,
        error: 'Too many incorrect attempts. Please request a new code.',
        status: 429,
        attemptsLeft: 0,
      };
    }

    return {
      ok: false,
      error: `Incorrect code. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`,
      status: 400,
      attemptsLeft,
    };
  }

  // ✅ Valid — mark as used immediately (single-use enforcement)
  record.used = true;
  await record.save();

  return { ok: true };
}
