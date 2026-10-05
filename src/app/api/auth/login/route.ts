import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Otp from '@/models/Otp';
import { signToken, verifyPassword, hashPassword } from '@/lib/auth';
import { checkSingleLimit, rateLimitHeaders } from '@/lib/media/rateLimit';
import { sendLoginAlertEmail } from '@/lib/email';

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

    const cleanIdentifier = typeof identifier === 'string' ? identifier.trim() : '';
    const cleanEmail = cleanIdentifier.toLowerCase();

    const user = await User.findOne({ 
      $or: [{ email: cleanEmail }, { mobileNumber: cleanIdentifier }]
    });
    
    // Constant-time/generic failure to prevent account enumeration
    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Secure verification: check bcrypt hash first, with auto-upgrade for legacy plain-text
    let isValid = false;
    const isBcrypt = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');

    if (isBcrypt) {
      isValid = await verifyPassword(password, user.password);
    } else {
      // Legacy plain-text password fallback: verify and automatically upgrade to bcrypt
      if (password === user.password) {
        isValid = true;
        try {
          user.password = await hashPassword(password);
          await user.save();
        } catch (upgradeErr) {
          console.warn('[auth] Could not auto-upgrade legacy password hash:', upgradeErr);
        }
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (user.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your account has been restricted or suspended. Please contact customer care.' },
        { status: 403 }
      );
    }

    // Generate token with normalized claims
    const token = await signToken({
      id: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Send login security alert email (asynchronous, non-fatal)
    sendLoginAlertEmail(user.email, user.name, ip, new Date()).catch((emailErr) => {
      console.warn('[auth] Could not send login alert email:', emailErr?.message ?? emailErr);
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

    // Set secure HTTP-only cookies (set both auth-token and token for full backward compatibility)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    };

    response.cookies.set({ name: 'auth-token', value: token, ...cookieOptions });
    response.cookies.set({ name: 'token', value: token, ...cookieOptions });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

