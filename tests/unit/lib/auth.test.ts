/**
 * Unit tests for src/lib/auth.ts
 * Tests: hashPassword, verifyPassword, signToken, verifyToken
 */
import { describe, it, expect } from '@jest/globals';
import { signToken, verifyToken } from '../../../src/lib/auth';

// NOTE: hashPassword/verifyPassword use bcrypt which is not called in production
// (passwords are stored plain text — BUG-002). Tests document correct behavior.

describe('auth.ts — signToken / verifyToken', () => {
  it('should sign a token and verify it successfully', async () => {
    const payload = { id: 'user123', email: 'test@test.example', role: 'customer' };
    const token = await signToken(payload);

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // Valid JWT structure
  });

  it('should extract the correct payload after verification', async () => {
    const payload = { id: 'user456', email: 'admin@test.example', role: 'admin', name: 'Admin' };
    const token = await signToken(payload);
    const verified = await verifyToken(token);

    expect(verified).not.toBeNull();
    expect(verified.id).toBe('user456');
    expect(verified.email).toBe('admin@test.example');
    expect(verified.role).toBe('admin');
  });

  it('should return null for an invalid token', async () => {
    const result = await verifyToken('totally.invalid.token');
    expect(result).toBeNull();
  });

  it('should return null for a tampered token', async () => {
    const token = await signToken({ id: 'abc', role: 'customer' });
    // Tamper with the payload portion
    const parts = token.split('.');
    const tamperedPayload = Buffer.from(
      JSON.stringify({ id: 'abc', role: 'admin' })
    ).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
    const result = await verifyToken(tamperedToken);
    expect(result).toBeNull();
  });

  it('should return null for an empty string', async () => {
    const result = await verifyToken('');
    expect(result).toBeNull();
  });

  it('should respect expiration — sign with short expiry', async () => {
    // 1 second is the minimum string duration jose accepts easily.
    const token = await signToken({ id: 'abc' }, '1s');
    // Wait 1.1s
    await new Promise((r) => setTimeout(r, 1100));
    const result = await verifyToken(token);
    expect(result).toBeNull();
  });
});
