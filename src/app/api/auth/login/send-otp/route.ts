import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Otp from '@/models/Otp';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { mobileNumber } = await request.json();

    if (!mobileNumber) {
      return NextResponse.json(
        { error: 'Mobile number is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await User.findOne({ mobileNumber });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Account not found. Please register first.' },
        { status: 404 }
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
    console.log(`[MOCK SMS SERVICE - LOGIN]`);
    console.log(`To: ${mobileNumber}`);
    console.log(`Message: Your Bespoken login OTP is ${generatedOtp}. It will expire in 5 minutes.`);
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
