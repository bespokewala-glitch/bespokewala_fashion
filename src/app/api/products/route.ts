import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import { IProduct } from '@/types/product';
import { preWarmMany } from '@/lib/preWarmVariants';
import { invalidateCachePrefix } from '@/lib/serverCache';
import { revalidatePath } from 'next/cache';

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
    const isNewArrival = searchParams.get('isNewArrival');
    
    const skip = (page - 1) * limit;
    
    const query: any = {};
    if (productType) query.productType = productType;
    if (isNewArrival === 'true') query.isNewArrival = true;
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (collectionName) query.collectionName = collectionName;
    if (occasion) query.occasion = occasion;
    
    // Support wildcard slug2 and slug3 from CollectionPageContent
    const slug2 = searchParams.get('slug2');
    const slug3 = searchParams.get('slug3');

    const buildInQuery = (val: string) => {
      const arr = val.split(',').map(v => v.trim()).filter(Boolean);
      if (arr.length === 0) return undefined;
      return { $in: arr.map(item => new RegExp(`^${item.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i')) };
    };

    if (slug2 && slug2.toLowerCase() !== 'all' && slug2.toLowerCase() !== 'all-products' && slug2.toLowerCase() !== 'all-collections') {
      const slug2Query = buildInQuery(slug2);
      if (slug2Query) {
        if (!query.$and) query.$and = [];
        // When slug3 is also present (3-segment URL), slug2 unambiguously = category.
        // When slug3 is absent (2-segment URL), keep the broad $or for collection pages.
        if (slug3 && slug3.toLowerCase() !== 'all' && slug3.toLowerCase() !== 'all-products' && slug3.toLowerCase() !== 'all-collections') {
          query.$and.push({ category: slug2Query });
        } else {
          query.$and.push({
            $or: [
              { category: slug2Query },
              { collectionName: slug2Query },
              { occasion: slug2Query }
            ]
          });
        }
      }
    }

    if (slug3 && slug3.toLowerCase() !== 'all' && slug3.toLowerCase() !== 'all-products' && slug3.toLowerCase() !== 'all-collections') {
      const slug3Query = buildInQuery(slug3);
      if (slug3Query) {
        if (!query.$and) query.$and = [];
        // slug3 is always the 3rd URL segment, unambiguously = subcategory.
        // The previous broad $or (subcategory OR collectionName OR occasion) caused products
        // with collectionName='lehenga' to appear on the subcategory page alongside products
        // with subcategory='lehenga', creating visible duplicates.
        query.$and.push({ subcategory: slug3Query });
      }
    }

    if (q) {
      const words = q.trim().split(/\s+/).filter(Boolean);
      const regexPattern = words.map(w => `(?=.*${w})`).join('');
      const regexString = `^${regexPattern}`;

      if (!query.$and) query.$and = [];
      query.$and.push({
        $or: [
          { name: { $regex: regexString, $options: 'i' } },
          { category: { $regex: regexString, $options: 'i' } },
          { subcategory: { $regex: regexString, $options: 'i' } },
          { collectionName: { $regex: regexString, $options: 'i' } }
        ]
      });
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

    const rawProducts = await Product.find(query)
      .select('_id name slug price originalPrice images referenceImages category subcategory collectionName inventoryCount productType isFeatured isNewArrival')
      .sort(sortQuery)
      .skip(skip)
      .limit(limit > 1000 ? 1000 : limit)
      .lean();

    // Backend deduplication safety net: guarantee each _id appears only once.
    // This handles any future edge case where a complex $or/$and query might
    // match the same document via two different conditions.
    const seenIds = new Map<string, boolean>();
    const products = rawProducts.filter((p: any) => {
      const id = p._id.toString();
      if (seenIds.has(id)) return false;
      seenIds.set(id, true);
      return true;
    });
      
    return NextResponse.json(products, {
      headers: {
        // s-maxage: CDN edge caches the response for 60s.
        // stale-while-revalidate: extends freshness to 10 min for subsequent requests.
        // Vary: required so CDN caches gzip and Brotli variants separately.
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
        'Vary': 'Accept-Encoding',
        'X-Content-Type-Options': 'nosniff',
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
      isNewArrival: Boolean(body.isNewArrival),
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

    // Fire-and-forget: pre-warm variants for the new product's images
    const newImageUrls: string[] = [
      ...(Array.isArray(body.images) ? body.images : []),
      body.referenceImages?.front,
      body.referenceImages?.back,
      body.referenceImages?.left,
      body.referenceImages?.right,
    ].filter(Boolean) as string[];
    if (newImageUrls.length > 0) {
      preWarmMany(newImageUrls).catch(() => {});
    }

    // Invalidate caches so frontend sees new products immediately
    invalidateCachePrefix('products:');
    invalidateCachePrefix('home:');
    revalidatePath('/', 'layout');

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
