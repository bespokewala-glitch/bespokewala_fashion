import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Otp from '@/models/Otp';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { name, email, mobileNumber, otp } = await request.json();

    if (!name || !email || !mobileNumber || !otp) {
      return NextResponse.json(
        { error: 'All fields including OTP are required' },
        { status: 400 }
      );
    }

    // Verify OTP
    const otpRecord = await Otp.findOne({ mobileNumber, otp });
    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Check if user already exists (double check just in case)
    const existingUser = await User.findOne({ 
      $or: [{ email }, { mobileNumber }] 
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email or mobile number already exists' },
        { status: 409 }
      );
    }

    // Create user
    const newUser = await User.create({
      name,
      email,
      mobileNumber,
      role: 'customer', // Default role for new registrations
    });

    // Delete the used OTP
    await Otp.deleteOne({ _id: otpRecord._id });

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
