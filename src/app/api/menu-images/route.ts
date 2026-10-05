import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import MenuImage from '@/models/MenuImage';
import { requireAdmin } from '@/lib/auth';
import { getOrFetch, invalidateCachePrefix } from '@/lib/serverCache';
import { checkAdminRateLimit } from '@/lib/media/rateLimit';
import { logAdminAction } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const productType = searchParams.get('productType');
    const category = searchParams.get('category');
    
    let query: any = {};
    if (productType) query.productType = productType;
    if (category) query.category = category;
    
    const cacheKey = `menu-images:${productType || ''}:${category || ''}`;
    const menuImages = await getOrFetch(cacheKey, 300, () =>
      MenuImage.find(query).lean()
    );
    return NextResponse.json(menuImages, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const rl = await checkAdminRateLimit(request, 'adminAction');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      );
    }

    const { errorResponse, user } = await requireAdmin(request);
    if (errorResponse) {
      return errorResponse;
    }

    await dbConnect();
    const body = await request.json();
    const { productType, category, images } = body;

    if (!productType || !category || !Array.isArray(images)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updatedMenuImage = await MenuImage.findOneAndUpdate(
      { productType, category },
      { images },
      { new: true, upsert: true }
    );

    invalidateCachePrefix('menu-images:');

    await logAdminAction({
      actor_id: user?.userId,
      actor_email: user?.email,
      action: 'content.updated',
      target_type: 'content',
      meta: {
        section: 'menu-images',
        productType,
        category,
        imageCount: images.length,
      },
      req: request,
    });

    return NextResponse.json(updatedMenuImage);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

