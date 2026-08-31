import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import { IProduct } from '@/types/product';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const productType = searchParams.get('productType');
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const collectionName = searchParams.get('collectionName');
    const occasion = searchParams.get('occasion');
    const q = searchParams.get('q');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const colors = searchParams.get('colors');
    const sort = searchParams.get('sort');
    
    const skip = (page - 1) * limit;
    
    const query: any = {};
    if (productType) query.productType = productType;
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (collectionName) query.collectionName = collectionName;
    if (occasion) query.occasion = occasion;
    
    if (q) {
      const words = q.trim().split(/\s+/).filter(Boolean);
      const regexPattern = words.map(w => `(?=.*${w})`).join('');
      const regexString = `^${regexPattern}`;

      query.$or = [
        { name: { $regex: regexString, $options: 'i' } },
        { category: { $regex: regexString, $options: 'i' } },
        { subcategory: { $regex: regexString, $options: 'i' } },
        { collectionName: { $regex: regexString, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (colors) {
      query.colors = colors;
    }

    let sortQuery: any = { createdAt: -1 };
    if (sort === 'price_asc') sortQuery = { price: 1 };
    if (sort === 'price_desc') sortQuery = { price: -1 };
    if (sort === 'newest') sortQuery = { createdAt: -1 };
    if (sort === 'popular') sortQuery = { isFeatured: -1, createdAt: -1 };

    const products = await Product.find(query)
      .select('_id name slug price originalPrice images referenceImages category subcategory collectionName inventoryCount productType isFeatured')
      .sort(sortQuery)
      .skip(skip)
      .limit(limit > 1000 ? 1000 : limit)
      .lean();
      
    return NextResponse.json(products, {
      headers: {
        // Cache at the CDN edge: fresh for 60s, serve stale for 30s while revalidating
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    
    // Check if slug is provided, otherwise generate one from name
    let slug = body.slug;
    if (!slug && body.name) {
      slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      // Ensure unique slug by appending timestamp if a product with this slug might exist
      const existing = await Product.findOne({ slug });
      if (existing) {
        slug = `${slug}-${Date.now()}`;
      }
    }
    
    if (!slug) {
       return NextResponse.json({ error: 'Name is required to generate a slug' }, { status: 400 });
    }

    const productData: Partial<IProduct> = {
      ...body,
      slug,
      images: Array.isArray(body.images) ? body.images : (body.images ? [body.images] : []),
      sizes: Array.isArray(body.sizes) ? body.sizes : [],
      colors: Array.isArray(body.colors) ? body.colors : [],
      subcategory: body.subcategory || 'general', // default if not provided
      price: Number(body.price) || 0,
      originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
      inventoryCount: Number(body.inventoryCount) || 0,
      isFeatured: Boolean(body.isFeatured),
      referenceImages: body.referenceImages || undefined,
      details: body.details || undefined,
      // Persist SEO fields if provided on creation.
      seo: body.seo
        ? {
            title: body.seo.title || undefined,
            description: body.seo.description || undefined,
            keywords: body.seo.keywords || undefined,
            canonicalUrl: body.seo.canonicalUrl || undefined,
            noIndex: Boolean(body.seo.noIndex),
            image: body.seo.image || undefined,
          }
        : undefined,
    };

    const product = await Product.create(productData);
    
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
