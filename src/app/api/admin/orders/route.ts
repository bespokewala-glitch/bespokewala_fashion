export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import '@/models/User'; // Side-effect import to prevent tree-shaking
import { requireAdmin } from '@/lib/auth';
import { HIDE_PENDING_RAZORPAY_FOR_ADMIN } from '@/lib/orderFilters';

export const revalidate = 60;

export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireAdmin(request);
    if (errorResponse) {
      return errorResponse;
    }

    await dbConnect();
    const orders = await Order.find(HIDE_PENDING_RAZORPAY_FOR_ADMIN).populate('user', 'name email').sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('Admin orders fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

