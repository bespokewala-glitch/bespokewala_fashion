export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Order from '@/models/Order';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/admin/users
 * Returns list of users/customers with order counts, total spend, and contact info.
 * Passwords are NEVER selected or exposed.
 */
export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireAdmin(request);
    if (errorResponse) return errorResponse;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const [users, orderStats] = await Promise.all([
      User.find(query, '-password').sort({ createdAt: -1 }).lean(),
      Order.aggregate([
        {
          $group: {
            _id: '$user',
            orderCount: { $sum: 1 },
            totalSpent: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'completed'] }, '$total', 0],
              },
            },
            lastOrderDate: { $max: '$createdAt' },
          },
        },
      ]),
    ]);

    // Map order stats to user records
    const statsMap = new Map();
    orderStats.forEach((s: any) => {
      if (s._id) {
        statsMap.set(s._id.toString(), s);
      }
    });

    const enrichedUsers = users.map((u: any) => {
      const stats = statsMap.get(u._id.toString()) || { orderCount: 0, totalSpent: 0, lastOrderDate: null };
      return {
        ...u,
        orderCount: stats.orderCount,
        totalSpent: stats.totalSpent,
        lastOrderDate: stats.lastOrderDate,
      };
    });

    return NextResponse.json({
      success: true,
      users: enrichedUsers,
      total: enrichedUsers.length,
    });
  } catch (error: any) {
    console.error('Admin users error:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve users' }, { status: 500 });
  }
}

