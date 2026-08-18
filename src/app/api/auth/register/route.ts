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
    const { name, email, mobileNumber, password } = await request.json();

    if (!name || !email || !mobileNumber || !password) {
      return NextResponse.json(
        { error: 'All fields including password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { mobileNumber }] 
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email or mobile number already exists' },
        { status: 409 }
      );
    }

    // Store password as plain text (as requested, though not recommended for production)
    const newUser = await User.create({
      name,
      email,
      mobileNumber,
      password: password,
      role: 'customer', // Default role for new registrations
    });

    // Generate token
    const token = await signToken({
      id: newUser._id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    const response = NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );

    // Set HTTP-only cookie to log them in immediately
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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
