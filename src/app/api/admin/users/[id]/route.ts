export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Order from '@/models/Order';
import { requireAdmin } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';
import { checkSingleLimit } from '@/lib/media/rateLimit';

/**
 * GET /api/admin/users/[id]
 * Returns full customer profile, addresses, and full order history.
 * Passwords are NEVER selected or returned.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { errorResponse } = await requireAdmin(request);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    const user = await User.findById(userId, '-password').lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Fetch order history for this user
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    const totalSpent = orders.reduce((sum, o) => {
      return o.paymentStatus === 'completed' ? sum + (o.total || 0) : sum;
    }, 0);

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        totalOrders: orders.length,
        totalSpent,
      },
      orders,
    });
  } catch (error: any) {
    console.error('Customer profile error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Updates customer status (active/suspended) or role (customer/admin).
 * Passwords are never accepted or modified here.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { errorResponse, user: currentAdmin } = await requireAdmin(request);
    if (errorResponse) return errorResponse;

    // Sensitive admin rate limit (suspension / role elevation)
    const rateLimit = await checkSingleLimit('adminSensitive', `admin:${currentAdmin.id}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many account modification attempts. Please wait.' },
        { status: 429 }
      );
    }

    await dbConnect();
    const resolvedParams = await params;
    const targetUserId = resolvedParams.id;

    const body = await request.json();
    const { status, role } = body;

    const updateFields: any = {};

    if (status !== undefined) {
      if (!['active', 'suspended'].includes(status)) {
        return NextResponse.json({ success: false, error: 'Status must be active or suspended' }, { status: 400 });
      }
      // Prevent admin from suspending themselves
      if (currentAdmin?.id === targetUserId && status === 'suspended') {
        return NextResponse.json({ success: false, error: 'You cannot suspend your own admin account.' }, { status: 400 });
      }
      updateFields.status = status;
    }

    if (role !== undefined) {
      if (!['customer', 'admin'].includes(role)) {
        return NextResponse.json({ success: false, error: 'Role must be customer or admin' }, { status: 400 });
      }
      // Prevent admin from demoting themselves
      if (currentAdmin?.id === targetUserId && role !== 'admin') {
        return NextResponse.json({ success: false, error: 'You cannot demote your own admin account.' }, { status: 400 });
      }
      updateFields.role = role;
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      { $set: updateFields },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // ── Audit log user restriction / role modification ───────────────────────
    logAdminAction({
      action: status !== undefined ? 'user_status_update' : 'user_role_update',
      actor_id: currentAdmin.id,
      actor_email: currentAdmin.email,
      target_type: 'user',
      target_id: targetUserId,
      outcome: 'success',
      req: request,
      meta: { targetEmail: updatedUser.email, status, role },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Customer account updated successfully',
    });
  } catch (error: any) {
    console.error('Customer update error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
