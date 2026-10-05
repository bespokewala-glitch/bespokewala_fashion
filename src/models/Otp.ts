/**
 * Otp.ts — Email OTP verification model.
 *
 * Design:
 *  - Stores a bcrypt hash of the OTP, never the plain value.
 *  - TTL index on `expiresAt` for automatic cleanup by MongoDB.
 *  - `attempts` tracks failed verifications (max enforced in API route).
 *  - `lastSentAt` enables resend cooldown enforcement.
 *  - `used` marks single-use: verified OTPs are immediately invalidated.
 *  - `purpose` isolates login OTPs from reset-password OTPs.
 */

import mongoose from 'mongoose';

export type OtpPurpose = 'login' | 'reset-password';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  purpose: {
    type: String,
    enum: ['login', 'reset-password'],
    required: true,
  },
  // bcrypt hash of the OTP — plain value is NEVER stored
  hashedOtp: {
    type: String,
    required: true,
  },
  // Number of failed verification attempts for this OTP
  attempts: {
    type: Number,
    default: 0,
  },
  // Whether this OTP has already been used
  used: {
    type: Boolean,
    default: false,
  },
  // When this OTP was last sent (for resend cooldown)
  lastSentAt: {
    type: Date,
    default: Date.now,
  },
  // Absolute expiry — MongoDB TTL index deletes the document automatically
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // TTL index: delete when expiresAt is reached
  },
});

// Compound index for fast lookup by email + purpose
otpSchema.index({ email: 1, purpose: 1 });

const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);

export default Otp;
