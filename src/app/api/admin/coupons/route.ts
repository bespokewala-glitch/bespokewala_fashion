import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Coupon from '@/models/Coupon';
import { requireAdmin } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';
import { checkSingleLimit } from '@/lib/media/rateLimit';

/**
 * GET /api/admin/coupons
 * List all coupons with optional search and active status filter.
 */
export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireAdmin(request);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status');

    const query: any = {};
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const coupons = await Coupon.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/coupons
 * Create a new coupon.
 */
export async function POST(request: Request) {
  try {
    const { user: currentAdmin, errorResponse } = await requireAdmin(request);
    if (errorResponse) return errorResponse;

    const rateResult = await checkSingleLimit('adminAction', `admin:${currentAdmin.id}`);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    await dbConnect();
    const body = await request.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      expiryDate,
      usageLimit,
      isActive,
    } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, error: 'Coupon code is required.' }, { status: 400 });
    }

    if (!discountType || !['percentage', 'fixed'].includes(discountType)) {
      return NextResponse.json({ success: false, error: 'Valid discount type (percentage or fixed) is required.' }, { status: 400 });
    }

    if (typeof discountValue !== 'number' || discountValue <= 0) {
      return NextResponse.json({ success: false, error: 'Valid positive discount value is required.' }, { status: 400 });
    }

    if (discountType === 'percentage' && discountValue > 100) {
      return NextResponse.json({ success: false, error: 'Percentage discount cannot exceed 100%.' }, { status: 400 });
    }

    const normalizedCode = code.toUpperCase().trim();
    const existing = await Coupon.findOne({ code: normalizedCode });
    if (existing) {
      return NextResponse.json({ success: false, error: `Coupon code "${normalizedCode}" already exists.` }, { status: 409 });
    }

    const newCoupon = await Coupon.create({
      code: normalizedCode,
      description: description?.trim() || '',
      discountType,
      discountValue,
      minOrderAmount: Math.max(0, Number(minOrderAmount) || 0),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      usageLimit: usageLimit ? Math.max(1, Number(usageLimit)) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    // ── Audit log coupon creation ────────────────────────────────────────────
    logAdminAction({
      action: 'coupon_create',
      actor_id: currentAdmin.id,
      actor_email: currentAdmin.email,
      target_type: 'coupon',
      target_id: newCoupon._id.toString(),
      outcome: 'success',
      req: request,
      meta: { code: newCoupon.code, discountType, discountValue },
    });

    return NextResponse.json({ success: true, coupon: newCoupon }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

