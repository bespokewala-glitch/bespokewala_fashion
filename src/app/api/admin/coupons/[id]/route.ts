import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Coupon from '@/models/Coupon';
import { requireAdmin } from '@/lib/auth';
import { checkAdminRateLimit } from '@/lib/media/rateLimit';
import { logAdminAction } from '@/lib/audit';

/**
 * PATCH /api/admin/coupons/[id]
 * Update coupon fields or toggle isActive.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = await checkAdminRateLimit(request, 'adminAction');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      );
    }

    const { errorResponse, user } = await requireAdmin(request);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const resolvedParams = await params;
    const body = await request.json();

    if (body.discountType !== undefined && !['percentage', 'fixed'].includes(body.discountType)) {
      return NextResponse.json({ success: false, error: 'Discount type must be percentage or fixed.' }, { status: 400 });
    }

    if (body.discountValue !== undefined) {
      const dv = Number(body.discountValue);
      if (isNaN(dv) || dv <= 0) {
        return NextResponse.json({ success: false, error: 'Discount value must be greater than 0.' }, { status: 400 });
      }
    }

    const allowedFields = [
      'description',
      'discountType',
      'discountValue',
      'minOrderAmount',
      'maxDiscountAmount',
      'expiryDate',
      'usageLimit',
      'isActive',
    ];

    const updates: any = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    const updated = await Coupon.findByIdAndUpdate(
      resolvedParams.id,
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    await logAdminAction({
      actor_id: user?.userId,
      actor_email: user?.email,
      action: 'coupon.updated',
      target_type: 'coupon',
      target_id: resolvedParams.id,
      meta: {
        code: updated.code,
        discountType: updated.discountType,
        discountValue: updated.discountValue,
        isActive: updated.isActive,
      },
      req: request,
    });

    return NextResponse.json({ success: true, coupon: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/coupons/[id]
 * Delete a coupon.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = await checkAdminRateLimit(request, 'adminSensitive');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      );
    }

    const { errorResponse, user } = await requireAdmin(request);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const resolvedParams = await params;

    const deleted = await Coupon.findByIdAndDelete(resolvedParams.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    await logAdminAction({
      actor_id: user?.userId,
      actor_email: user?.email,
      action: 'coupon.deleted',
      target_type: 'coupon',
      target_id: resolvedParams.id,
      meta: {
        code: deleted.code,
      },
      req: request,
    });

    return NextResponse.json({ success: true, message: `Coupon "${deleted.code}" deleted.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
