export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';
import { checkSingleLimit } from '@/lib/media/rateLimit';

/**
 * GET /api/admin/inventory
 * Query params:
 *   search: string (product name, category, or subcategory)
 *   filter: 'all' | 'low_stock' | 'out_of_stock' | 'in_stock'
 *   productType: string
 *   page: number
 *   limit: number
 */
export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireAdmin(request);
    if (errorResponse) return errorResponse;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const filter = searchParams.get('filter') || 'all';
    const productType = searchParams.get('productType');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { subcategory: { $regex: search, $options: 'i' } },
        { 'details.styleCode': { $regex: search, $options: 'i' } },
      ];
    }

    if (productType && productType !== 'all') {
      query.productType = productType;
    }

    if (filter === 'out_of_stock') {
      query.inventoryCount = 0;
    } else if (filter === 'low_stock') {
      query.inventoryCount = { $gt: 0, $lte: 5 };
    } else if (filter === 'in_stock') {
      query.inventoryCount = { $gt: 5 };
    }

    const [products, total, totalOutOfStock, totalLowStock] = await Promise.all([
      Product.find(query)
        .select('_id name slug price inventoryCount images productType category subcategory isFeatured isNewArrival details')
        .sort({ inventoryCount: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
      Product.countDocuments({ inventoryCount: 0 }),
      Product.countDocuments({ inventoryCount: { $gt: 0, $lte: 5 } }),
    ]);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalOutOfStock,
        totalLowStock,
      },
    });
  } catch (error: any) {
    console.error('Admin inventory fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/inventory
 * Updates stock level directly:
 * Body: { productId: string, inventoryCount: number }
 */
export async function PATCH(request: Request) {
  try {
    const { user: currentAdmin, errorResponse } = await requireAdmin(request);
    if (errorResponse) return errorResponse;

    const rateResult = await checkSingleLimit('adminAction', `admin:${currentAdmin.id}`);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many inventory updates. Please slow down.' },
        { status: 429 }
      );
    }

    await dbConnect();
    const body = await request.json();
    const { productId, inventoryCount } = body;

    if (!productId || typeof inventoryCount !== 'number' || inventoryCount < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid productId and non-negative inventoryCount are required' },
        { status: 400 }
      );
    }

    const updated = await Product.findByIdAndUpdate(
      productId,
      { $set: { inventoryCount: Math.floor(inventoryCount) } },
      { new: true, select: '_id name inventoryCount' }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // ── Audit log inventory adjustment ───────────────────────────────────────
    logAdminAction({
      action: 'inventory_update',
      actor_id: currentAdmin.id,
      actor_email: currentAdmin.email,
      target_type: 'inventory',
      target_id: productId,
      outcome: 'success',
      req: request,
      meta: { productName: updated.name, newInventoryCount: updated.inventoryCount },
    });

    return NextResponse.json({
      success: true,
      product: updated,
      message: `Stock updated to ${updated.inventoryCount} for "${updated.name}"`,
    });
  } catch (error: any) {
    console.error('Admin inventory update error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
