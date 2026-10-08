export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import { requireAdmin } from '@/lib/auth';
import { sendOrderStatusEmail } from '@/lib/email';
import { logAdminAction } from '@/lib/audit';
import { checkSingleLimit } from '@/lib/media/rateLimit';

const VALID_STATUSES = ['confirmed', 'production', 'qc', 'dispatched', 'in_transit', 'delivered', 'cancelled'];

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user: currentAdmin, errorResponse } = await requireAdmin(request);
    if (errorResponse) return errorResponse;

    // Rate-limit admin actions
    const adminLimit = await checkSingleLimit('adminAction', `admin:${currentAdmin.id}`);
    if (!adminLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many administrative requests. Please slow down.' },
        { status: 429 }
      );
    }

    await dbConnect();
    const resolvedParams = await params;
    const body = await request.json();
    let { status } = body;

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
    }

    // Support legacy/alias statuses
    const STATUS_ALIASES: Record<string, string> = {
      processing: 'production',
      shipped: 'dispatched',
    };
    if (STATUS_ALIASES[status]) {
      status = STATUS_ALIASES[status];
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }

    const order = await Order.findByIdAndUpdate(
      resolvedParams.id,
      { orderStatus: status },
      { new: true }
    ).populate('user', 'name email');

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // ── Audit log administrative status change ────────────────────────────────
    logAdminAction({
      action: status === 'cancelled' ? 'order_cancellation' : 'order_status_update',
      actor_id: currentAdmin.id,
      actor_email: currentAdmin.email,
      target_type: 'order',
      target_id: order._id.toString(),
      outcome: 'success',
      req: request,
      meta: { newStatus: status, total: order.total },
    });

    // ── Send status update email to customer (non-fatal) ─────────────────────
    const customerEmail = order.shippingDetails?.email || (order.user as any)?.email;
    const customerName = `${order.shippingDetails?.firstName || ''} ${order.shippingDetails?.lastName || ''}`.trim()
      || (order.user as any)?.name
      || 'Customer';

    if (customerEmail) {
      sendOrderStatusEmail(
        customerEmail,
        customerName,
        {
          orderId: order._id.toString(),
          items: order.items,
          total: order.total,
          currency: order.displayCurrency || '₹',
        },
        status
      ).catch((e) => console.error('[email] Status update email failed:', e?.message));
    }
    // ─────────────────────────────────────────────────────────────────────────

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user: currentAdmin, errorResponse } = await requireAdmin(request);
    if (errorResponse) return errorResponse;

    // Rate-limit admin actions
    const adminLimit = await checkSingleLimit('adminAction', `admin:${currentAdmin.id}`);
    if (!adminLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many administrative requests. Please slow down.' },
        { status: 429 }
      );
    }

    await dbConnect();
    const resolvedParams = await params;
    const order = await Order.findByIdAndDelete(resolvedParams.id);

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Audit log administrative deletion
    logAdminAction({
      action: 'order.deleted',
      actor_id: currentAdmin.id,
      actor_email: currentAdmin.email,
      target_type: 'order',
      target_id: resolvedParams.id,
      outcome: 'success',
      req: request,
      meta: { orderNumber: order.orderNumber, total: order.total },
    });

    return NextResponse.json({ success: true, message: 'Order deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

