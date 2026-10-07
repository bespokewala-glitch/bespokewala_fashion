export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Otp from '@/models/Otp';
import { signToken, hashPassword } from '@/lib/auth';
import { checkSingleLimit, rateLimitHeaders } from '@/lib/media/rateLimit';
import { sendWelcomeEmail } from '@/lib/email';

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

    // Input validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanMobile = mobileNumber.trim();

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email: cleanEmail }, { mobileNumber: cleanMobile }] 
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email or mobile number already exists' },
        { status: 409 }
      );
    }

    // Securely hash password with bcrypt
    const hashedPassword = await hashPassword(password);

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      mobileNumber: cleanMobile,
      password: hashedPassword,
      role: 'customer',
    });

    // Generate token
    const token = await signToken({
      id: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    // Send welcome email (asynchronous, non-fatal)
    sendWelcomeEmail(newUser.email, newUser.name).catch((emailErr) => {
      console.error('[auth] Failed to send welcome email:', emailErr?.message ?? emailErr);
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
      maxAge: 60 * 60 * 24 * 7, // 7 days
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
