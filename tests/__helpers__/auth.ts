/**
 * Auth helpers for tests — generates valid JWT tokens without hitting the DB.
 * Uses the same signToken/verifyToken from src/lib/auth.ts.
 */
import { SignJWT } from 'jose';

const secretKey = process.env.JWT_SECRET || 'test-jwt-secret-do-not-use-in-production';
const key = new TextEncoder().encode(secretKey);

export interface TestUser {
  id: string;
  email: string;
  role: 'customer' | 'admin';
  name: string;
}

/**
 * Generate a valid JWT auth-token for a test user.
 * Mirrors the exact payload shape used in signToken (src/lib/auth.ts).
 */
export async function generateTestToken(user: TestUser, expiresIn = '1d'): Promise<string> {
  return await new SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

/**
 * Generate an expired JWT token for testing session expiry.
 */
export async function generateExpiredToken(user: TestUser): Promise<string> {
  return await new SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)) // 2 days ago
    .setExpirationTime(new Date(Date.now() - 24 * 60 * 60 * 1000)) // expired 1 day ago
    .sign(key);
}

// Reusable test users — NEVER use real credentials
export const TEST_CUSTOMER: TestUser = {
  id: '000000000000000000000001',
  email: 'customer@test.example',
  role: 'customer',
  name: 'Test Customer',
};

export const TEST_ADMIN: TestUser = {
  id: '000000000000000000000002',
  email: 'admin@test.example',
  role: 'admin',
  name: 'Test Admin',
};

export const TEST_CUSTOMER_2: TestUser = {
  id: '000000000000000000000003',
  email: 'customer2@test.example',
  role: 'customer',
  name: 'Test Customer Two',
};
