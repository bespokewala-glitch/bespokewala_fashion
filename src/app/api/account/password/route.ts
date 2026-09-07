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

export async function PUT(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'New password must be different from current password' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password (plain text as per current system)
    if (user.password !== currentPassword) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error updating password:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
