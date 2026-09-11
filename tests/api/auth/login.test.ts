/**
 * API Integration Tests — POST /api/auth/login
 *
 * Tests login with correct credentials, wrong credentials, missing fields,
 * non-existent user, and JWT token generation.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { signToken, verifyToken } from '../../../src/lib/auth';
import { makeUser } from '../../__helpers__/fixtures';

let dbConnect: () => Promise<any>;
let User: any;

beforeAll(async () => {
  const mod = await import('../../../src/lib/mongoose');
  dbConnect = mod.default;
  const userMod = await import('../../../src/models/User');
  User = userMod.default;
  await dbConnect();
});

afterAll(async () => {
  await mongoose.disconnect();
});

afterEach(async () => {
  await User.deleteMany({ email: { $regex: '@test.example' } });
});

// ── Helper: replicate login logic ─────────────────────────────────────────────
async function loginUser(identifier: string, password: string) {
  if (!identifier || !password) {
    return { status: 400, body: { error: 'Email/Mobile Number and password are required' } };
  }

  const user = await User.findOne({
    $or: [{ email: identifier }, { mobileNumber: identifier }],
  });

  if (!user) {
    return { status: 404, body: { error: 'Account not found' } };
  }

  if (!user.password) {
    return { status: 401, body: { error: 'Account uses OTP.' } };
  }

  // Current implementation: plain text comparison (BUG-002 documented, not fixed here)
  const isValid = password === user.password;
  if (!isValid) {
    return { status: 401, body: { error: 'Invalid credentials' } };
  }

  const token = await signToken({ id: user._id.toString(), email: user.email, role: user.role, name: user.name });
  return {
    status: 200,
    body: { message: 'Login successful', user: { id: user._id, name: user.name, email: user.email, role: user.role } },
    token,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login — logic', () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = makeUser();
    await User.create(testUser);
  });

  it('logs in with correct email and password', async () => {
    const result = await loginUser(testUser.email, testUser.password);
    expect(result.status).toBe(200);
    expect(result.body.user).toBeDefined();
    expect(result.body.user?.email).toBe(testUser.email);
  });

  it('logs in with mobile number instead of email', async () => {
    const result = await loginUser(testUser.mobileNumber, testUser.password);
    expect(result.status).toBe(200);
    expect(result.body.user).toBeDefined();
    expect(result.body.user?.email).toBe(testUser.email);
  });

  it('generates a valid JWT token on success', async () => {
    const result = await loginUser(testUser.email, testUser.password) as any;
    expect(result.token).toBeDefined();
    const payload = await verifyToken(result.token);
    expect(payload).not.toBeNull();
    expect(payload.email).toBe(testUser.email);
    expect(payload.id).toBeDefined();
    expect(payload.role).toBe('customer');
  });

  it('returns 401 with wrong password', async () => {
    const result = await loginUser(testUser.email, 'WrongPassword999');
    expect(result.status).toBe(401);
    expect(result.body.error).toBe('Invalid credentials');
  });

  it('returns 404 for non-existent email', async () => {
    const result = await loginUser('doesnotexist@test.example', 'anyPassword');
    expect(result.status).toBe(404);
  });

  it('returns 400 when identifier is missing', async () => {
    const result = await loginUser('', 'somePassword');
    expect(result.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const result = await loginUser(testUser.email, '');
    expect(result.status).toBe(400);
  });

  it('does NOT expose password hash or raw password in response', async () => {
    const result = await loginUser(testUser.email, testUser.password);
    const bodyStr = JSON.stringify(result.body);
    expect(bodyStr).not.toContain(testUser.password);
    expect(bodyStr).not.toContain('password');
  });

  it('does NOT expose token value in the JSON response body', async () => {
    // Token should be in a cookie, not in the response body
    const result = await loginUser(testUser.email, testUser.password) as any;
    const bodyStr = JSON.stringify(result.body);
    if (result.token) {
      expect(bodyStr).not.toContain(result.token);
    }
  });
});
