import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  let userId = payload?.userId || payload?.id;
  
  if (userId && typeof userId === 'object' && userId.buffer) {
    userId = Buffer.from(Object.values(userId.buffer)).toString('hex');
  } else if (userId) {
    userId = userId.toString();
  }
  
  return userId || null;
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
