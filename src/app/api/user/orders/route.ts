import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const tokenCookie = (await cookies()).get('auth-token');
    
    if (!tokenCookie) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(tokenCookie.value);
    
    // BUG-003 fix: signToken sets { id } but some code may have used { userId }.
    // Normalize: accept whichever claim is present.
    const userId = user?.id || user?.userId;
    
    if (!user || !userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 }) // Newest first
      .lean();

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
