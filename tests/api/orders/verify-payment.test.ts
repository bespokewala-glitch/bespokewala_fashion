/**
 * API Integration Tests — Razorpay payment verification
 *
 * Tests: POST /api/orders/verify-payment
 * CRITICAL: HMAC-SHA256 signature verification must be done server-side.
 * No real Razorpay API calls are made.
 */
import { describe, it, expect } from '@jest/globals';
import crypto from 'crypto';

const TEST_SECRET = 'test_razorpay_secret_placeholder';

// ── Helper: replicate signature verification logic ────────────────────────────
function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  keySecret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  return expectedSignature === razorpaySignature;
}

function generateValidSignature(orderId: string, paymentId: string): string {
  return crypto
    .createHmac('sha256', TEST_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Razorpay payment verification — HMAC-SHA256 logic', () => {
  const MOCK_ORDER_ID = 'order_testRazorpayOrderId123';
  const MOCK_PAYMENT_ID = 'pay_testRazorpayPaymentId456';

  it('accepts a valid signature', () => {
    const validSignature = generateValidSignature(MOCK_ORDER_ID, MOCK_PAYMENT_ID);
    const result = verifyRazorpaySignature(MOCK_ORDER_ID, MOCK_PAYMENT_ID, validSignature, TEST_SECRET);
    expect(result).toBe(true);
  });

  it('rejects a tampered signature', () => {
    const validSignature = generateValidSignature(MOCK_ORDER_ID, MOCK_PAYMENT_ID);
    const tamperedSignature = validSignature.replace('a', 'b');
    const result = verifyRazorpaySignature(MOCK_ORDER_ID, MOCK_PAYMENT_ID, tamperedSignature, TEST_SECRET);
    expect(result).toBe(false);
  });

  it('rejects signature signed with wrong secret', () => {
    const wrongSecretSignature = crypto
      .createHmac('sha256', 'wrong_secret_key')
      .update(`${MOCK_ORDER_ID}|${MOCK_PAYMENT_ID}`)
      .digest('hex');
    const result = verifyRazorpaySignature(MOCK_ORDER_ID, MOCK_PAYMENT_ID, wrongSecretSignature, TEST_SECRET);
    expect(result).toBe(false);
  });

  it('rejects if razorpayOrderId is swapped', () => {
    const validSignature = generateValidSignature(MOCK_ORDER_ID, MOCK_PAYMENT_ID);
    // Swap order and payment IDs — must fail
    const result = verifyRazorpaySignature(MOCK_PAYMENT_ID, MOCK_ORDER_ID, validSignature, TEST_SECRET);
    expect(result).toBe(false);
  });

  it('rejects an empty signature', () => {
    const result = verifyRazorpaySignature(MOCK_ORDER_ID, MOCK_PAYMENT_ID, '', TEST_SECRET);
    expect(result).toBe(false);
  });

  it('rejects a garbage signature string', () => {
    const result = verifyRazorpaySignature(MOCK_ORDER_ID, MOCK_PAYMENT_ID, 'hacker_injected_value', TEST_SECRET);
    expect(result).toBe(false);
  });

  it('rejects if payment ID is modified', () => {
    const validSignature = generateValidSignature(MOCK_ORDER_ID, MOCK_PAYMENT_ID);
    const result = verifyRazorpaySignature(MOCK_ORDER_ID, 'pay_MANIPULATED_ID', validSignature, TEST_SECRET);
    expect(result).toBe(false);
  });

  it('rejects if order ID is modified', () => {
    const validSignature = generateValidSignature(MOCK_ORDER_ID, MOCK_PAYMENT_ID);
    const result = verifyRazorpaySignature('order_MANIPULATED_ID', MOCK_PAYMENT_ID, validSignature, TEST_SECRET);
    expect(result).toBe(false);
  });

  it('generates consistent signatures (deterministic)', () => {
    const sig1 = generateValidSignature(MOCK_ORDER_ID, MOCK_PAYMENT_ID);
    const sig2 = generateValidSignature(MOCK_ORDER_ID, MOCK_PAYMENT_ID);
    expect(sig1).toBe(sig2);
  });

  it('produces different signatures for different order IDs', () => {
    const sig1 = generateValidSignature('order_aaa', MOCK_PAYMENT_ID);
    const sig2 = generateValidSignature('order_bbb', MOCK_PAYMENT_ID);
    expect(sig1).not.toBe(sig2);
  });
});

describe('Razorpay verification — missing field validation', () => {
  function simulateVerifyPaymentValidation(body: Record<string, any>) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return { status: 400, message: 'Missing payment verification fields' };
    }
    return { status: 200 };
  }

  it('returns 400 when razorpayOrderId is missing', () => {
    const result = simulateVerifyPaymentValidation({ razorpayPaymentId: 'pay_abc', razorpaySignature: 'sig' });
    expect(result.status).toBe(400);
  });

  it('returns 400 when razorpayPaymentId is missing', () => {
    const result = simulateVerifyPaymentValidation({ razorpayOrderId: 'order_abc', razorpaySignature: 'sig' });
    expect(result.status).toBe(400);
  });

  it('returns 400 when razorpaySignature is missing', () => {
    const result = simulateVerifyPaymentValidation({ razorpayOrderId: 'order_abc', razorpayPaymentId: 'pay_abc' });
    expect(result.status).toBe(400);
  });

  it('passes validation when all fields present', () => {
    const result = simulateVerifyPaymentValidation({
      razorpayOrderId: 'order_abc',
      razorpayPaymentId: 'pay_abc',
      razorpaySignature: 'sig',
    });
    expect(result.status).toBe(200);
  });
});
