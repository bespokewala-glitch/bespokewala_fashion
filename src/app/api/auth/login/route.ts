import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Otp from '@/models/Otp';
import { signToken } from '@/lib/auth';
import { checkSingleLimit, rateLimitHeaders } from '@/lib/media/rateLimit';

function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateResult = await checkSingleLimit('auth', `auth:${ip}`);
    
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Try again later.` },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateResult.retryAfterSeconds),
            ...rateLimitHeaders(rateResult.remaining ?? 0, 15 * 60_000)
          }
        }
      );
    }

    await dbConnect();
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/Mobile Number and password are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ 
      $or: [{ email: identifier }, { mobileNumber: identifier }]
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'Account uses OTP. Please reset your password or use old login.' },
        { status: 401 }
      );
    }

    // Plain text password comparison (as requested)
    const isValid = password === user.password;

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate token
    const token = await signToken({
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Set HTTP-only cookie
    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
