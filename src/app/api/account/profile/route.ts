export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    const { user: authUser, errorResponse } = await requireAuth(request);
    if (errorResponse) {
      return errorResponse;
    }

    const userId = authUser.id || authUser.userId;

    await dbConnect();
    const user = await User.findById(userId).select('name email mobileNumber');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber || ''
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { user: authUser, errorResponse } = await requireAuth(request);
    if (errorResponse) {
      return errorResponse;
    }

    const userId = authUser.id || authUser.userId;

    const { name, mobileNumber } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    await dbConnect();
    
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { name, mobileNumber },
      { new: true }
    ).select('name email mobileNumber');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        mobileNumber: updatedUser.mobileNumber || ''
      }
    });
    
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
