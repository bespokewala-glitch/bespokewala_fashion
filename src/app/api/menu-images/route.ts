import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import MenuImage from '@/models/MenuImage';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getOrFetch, invalidateCachePrefix } from '@/lib/serverCache';

// Helper to verify admin token
async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return false;
  
  try {
    const payload = await verifyToken(token);
    return payload?.role === 'admin';
  } catch (error) {
    return false;
  }
}

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
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    return NextResponse.json(updatedMenuImage);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
