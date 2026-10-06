export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAuth, verifyPassword, hashPassword } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export async function PUT(request: Request) {
  try {
    const { user: authUser, errorResponse } = await requireAuth(request);
    if (errorResponse) {
      return errorResponse;
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'New password must be different from current password' }, { status: 400 });
    }

    await dbConnect();
    const userId = authUser.id || authUser.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password (supports bcrypt and legacy plain text fallback)
    let isCurrentValid = false;
    if (user.password) {
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        isCurrentValid = await verifyPassword(currentPassword, user.password);
      } else {
        isCurrentValid = (user.password === currentPassword);
      }
    }

    if (!isCurrentValid) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    // Update with securely hashed password
    user.password = await hashPassword(newPassword);
    await user.save();

    return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error updating password:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
