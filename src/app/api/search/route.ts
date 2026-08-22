import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const category = searchParams.get('category');
    const productType = searchParams.get('productType');
    
    const query: any = {};
    
    // Text search using regex for partial matching (live search)
    if (q) {
      const words = q.trim().split(/\s+/).filter(Boolean);
      // Create a regex that ensures every word is present somewhere in the string, in any order.
      // e.g. "Designer Saree" -> /^(?=.*Designer)(?=.*Saree)/i
      const regexPattern = words.map(w => `(?=.*${w})`).join('');
      const regexString = `^${regexPattern}`;
      
      query.$or = [
        { name: { $regex: regexString, $options: 'i' } },
        { category: { $regex: regexString, $options: 'i' } },
        { subcategory: { $regex: regexString, $options: 'i' } },
        { collectionName: { $regex: regexString, $options: 'i' } }
      ];
    }
    
    // Filters
    if (category) query.category = category;
    if (productType) query.productType = productType;
    
    // Price range
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Occasion
    const occasion = searchParams.get('occasion');
    if (occasion) query.occasion = occasion;
    
    // Collections
    const collectionName = searchParams.get('collectionName');
    if (collectionName) query.collectionName = collectionName;

    // Sorting
    const sortParam = searchParams.get('sort');
    let sort: any = {};
    
    // Default sort (newest)
    sort = { createdAt: -1 };

    if (sortParam === 'price_asc') sort = { price: 1 };
    if (sortParam === 'price_desc') sort = { price: -1 };
    if (sortParam === 'newest') sort = { createdAt: -1 };
    if (sortParam === 'popular') sort = { isFeatured: -1, createdAt: -1 };

    let productsQuery = Product.find(query);
    
    productsQuery = productsQuery.select(
      '_id name slug price originalPrice images category productType isFeatured'
    );
    
    const products = await productsQuery
      .sort(sort)
      .limit(limit > 100 ? 100 : limit)
      .lean();
      
    // Count total matches for pagination/filtering UI
    const totalCount = await Product.countDocuments(query);
      
    return NextResponse.json({
      products,
      totalCount,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json({ error: 'Failed to search products' }, { status: 500 });
  }
}
