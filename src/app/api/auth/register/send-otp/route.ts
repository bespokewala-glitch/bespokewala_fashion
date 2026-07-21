import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Otp from '@/models/Otp';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { mobileNumber, email } = await request.json();

    if (!mobileNumber || !email) {
      return NextResponse.json(
        { error: 'Mobile number and email are required' },
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

    // Generate a 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove any existing OTPs for this number to prevent spam
    await Otp.deleteMany({ mobileNumber });

    // Save the new OTP
    await Otp.create({
      mobileNumber,
      otp: generatedOtp,
    });

    // MOCK SENDING SMS: Log to console
    console.log(`\n==========================================`);
    console.log(`[MOCK SMS SERVICE]`);
    console.log(`To: ${mobileNumber}`);
    console.log(`Message: Your Bespoken registration OTP is ${generatedOtp}. It will expire in 5 minutes.`);
    console.log(`==========================================\n`);

    return NextResponse.json(
      { message: 'OTP sent successfully (check terminal)' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
