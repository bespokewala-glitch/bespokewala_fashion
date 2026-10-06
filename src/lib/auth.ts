import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const secretKey = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'super-secret-key-for-development-only';
const key = new TextEncoder().encode(secretKey);

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: any, expiresIn: string = '1d'): Promise<string> {
  const normalizedPayload = {
    ...payload,
    id: payload.id || payload.userId,
    userId: payload.userId || payload.id,
  };

  return await new SignJWT(normalizedPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Extracts JWT token from request cookies (auth-token or token) or Authorization header.
 */
export async function getAuthToken(req?: Request): Promise<string | null> {
  // 1. Check Authorization header if request is provided
  if (req) {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
  }

  // 2. Check cookies using next/headers
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value || cookieStore.get('token')?.value;
    if (token) return token;
  } catch {
    // cookies() may throw outside Next.js request context
  }

  // 3. Fallback: parse cookie header directly from Request if available
  if (req) {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)(?:auth-token|token)=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  return null;
}

/**
 * Validates the current user session and returns decoded user payload or null.
 */
export async function getAuthUser(req?: Request): Promise<any | null> {
  const token = await getAuthToken(req);
  if (!token) return null;
  return await verifyToken(token);
}

/**
 * Server-side guard: requires a valid authenticated user.
 * Returns { user, errorResponse: null } if authenticated,
 * or { user: null, errorResponse: NextResponse } (401) if not.
 */
export async function requireAuth(req?: Request) {
  const { NextResponse } = await import('next/server');
  const user = await getAuthUser(req);
  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 }),
    };
  }
  return { user, errorResponse: null };
}

/**
 * Server-side guard: requires an authenticated user with 'admin' role.
 * Returns { user, errorResponse: null } if admin,
 * or 401 if unauthenticated, 403 if authenticated but not admin.
 */
export async function requireAdmin(req?: Request) {
  const { NextResponse } = await import('next/server');
  const user = await getAuthUser(req);
  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: 'Unauthorized. Admin login required.' }, { status: 401 }),
    };
  }
  if (user.role !== 'admin') {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 }),
    };
  }
  return { user, errorResponse: null };
}

/**
 * Resolves the canonical site URL for OAuth redirects and emails.
 * Normalizes trailing slashes, inspects forwarded headers, and defaults cleanly.
 */
export function getSiteUrl(req?: Request): string {
  const envUrl = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL)?.trim().replace(/\/+$/, '');

  // 1. If explicit env variable is set and not localhost, respect it
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }

  // 2. Check incoming request headers if available
  if (req) {
    const forwardedHost = req.headers.get('x-forwarded-host');
    const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
    if (forwardedHost) {
      const host = forwardedHost.split(',')[0].trim();
      return `${forwardedProto}://${host}`.replace(/\/+$/, '');
    }

    const host = req.headers.get('host');
    if (host && !host.includes('localhost')) {
      const proto = 'https';
      return `${proto}://${host}`.replace(/\/+$/, '');
    }
  }

  // 3. Fallback to envUrl if set
  if (envUrl) {
    return envUrl;
  }

  // 4. Default based on NODE_ENV
  return process.env.NODE_ENV === 'production'
    ? 'https://www.bespokewala.com'
    : 'http://localhost:3000';
}
