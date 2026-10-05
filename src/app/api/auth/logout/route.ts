import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json(
    { message: 'Logged out successfully' },
    { status: 200 }
  );

  // Clear all auth cookies
  const clearCookieOptions = {
    value: '',
    httpOnly: true,
    expires: new Date(0),
    maxAge: 0,
    path: '/',
  };

  response.cookies.set({ name: 'auth-token', ...clearCookieOptions });
  response.cookies.set({ name: 'token', ...clearCookieOptions });

  return response;
}

