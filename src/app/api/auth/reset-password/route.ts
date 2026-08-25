import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
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
    const rateResult = await checkSingleLimit('auth', `auth-reset:${ip}`);
    
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
        { error: 'Identifier and new password are required' },
        { status: 400 }
      );
    }

    // Find the user by email or mobile
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { mobileNumber: identifier }] 
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email or mobile number' },
        { status: 404 }
      );
    }

    // Store password as plain text to match existing auth pattern
    user.password = password;
    await user.save();

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
