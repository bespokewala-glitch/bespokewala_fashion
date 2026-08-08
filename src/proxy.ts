import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-key-for-development-only';
const key = new TextEncoder().encode(secretKey);

// Named export (required by Next.js 16+ proxy convention)
export async function proxy(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const isDashboard = pathname.startsWith('/dashboard');
  const isAccount = pathname.startsWith('/account');
  const isLogin = pathname.startsWith('/login');

  let payload = null;

  if (token) {
    try {
      const verified = await jwtVerify(token, key);
      payload = verified.payload;
    } catch (err) {
      // Token is invalid or expired
    }
  }

  // If user is accessing protected routes without valid token
  if ((isDashboard || isAccount) && !payload) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is accessing admin routes but is not admin
  if (isDashboard && payload?.role !== 'admin') {
    return NextResponse.redirect(new URL('/account', request.url));
  }

  // If user is logged in and tries to access login page, redirect them away
  if (isLogin && payload) {
    if (payload.role === 'admin') {
      return NextResponse.redirect(new URL('/dashboard/campaigns', request.url));
    } else {
      return NextResponse.redirect(new URL('/account', request.url));
    }
  }

  return NextResponse.next();
}

// Default export alias (belt-and-suspenders for Turbopack recognition)
export default proxy;

export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*', '/login'],
};
