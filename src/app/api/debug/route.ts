import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdmin(req);
  if (errorResponse) {
    return errorResponse;
  }

  await dbConnect();
  
  const searchParams = req.nextUrl.searchParams;
  const productType = searchParams.get('productType');
  const category = searchParams.get('category');
  const slug3 = searchParams.get('slug3');
  
  const productQuery: any = {};
  
  const buildInQuery = (val: string) => {
    const arr = val.split(',').map(v => v.trim()).filter(Boolean);
    if (arr.length === 0) return undefined;
    return { $in: arr.map(item => new RegExp(`^${item.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i')) };
  };

  if (productType && productType !== 'all') productQuery.productType = buildInQuery(productType);
  if (category && category !== 'all') productQuery.category = buildInQuery(category);
  
  if (slug3) {
    const isAll = slug3.toLowerCase() === 'all';
    const slug3Query = !isAll ? buildInQuery(slug3) : undefined;
    if (slug3Query) {
      if (!productQuery.$and) productQuery.$and = [];
      productQuery.$and.push({
        $or: [
          { subcategory: slug3Query },
          { collectionName: slug3Query },
          { occasion: slug3Query }
        ]
      });
    }
  }

  // To serialize RegExps for JSON response
  const serializeQuery = (obj: any): any => {
    if (obj instanceof RegExp) return obj.toString();
    if (Array.isArray(obj)) return obj.map(serializeQuery);
    if (typeof obj === 'object' && obj !== null) {
      const newObj: any = {};
      for (const key in obj) {
        newObj[key] = serializeQuery(obj[key]);
      }
      return newObj;
    }
    return obj;
  };

  const results = await Product.find(productQuery).lean();

  return NextResponse.json({
    query: serializeQuery(productQuery),
    count: results.length,
    results: results.map(r => ({
      name: r.name,
      subcategory: r.subcategory,
      collectionName: r.collectionName,
      occasion: r.occasion
    }))
  });
}

