import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import { IProduct } from '@/types/product';

export async function GET() {
  try {
    await dbConnect();
    const products = await Product.find({}).sort({ createdAt: -1 });
    return NextResponse.json(products);
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
    };

    const product = await Product.create(productData);
    
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
