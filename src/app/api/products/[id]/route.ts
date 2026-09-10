import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import { IProduct } from '@/types/product';
import { preWarmGcsKey } from '@/lib/preWarmVariants';


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const product = await Product.findById(id).lean();
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const body = await req.json();
    
    const productData: Partial<IProduct> = {
      ...body,
      images: Array.isArray(body.images) ? body.images : (body.images ? [body.images] : []),
      sizes: Array.isArray(body.sizes) ? body.sizes : [],
      colors: Array.isArray(body.colors) ? body.colors : [],
      subcategory: body.subcategory || 'general',
      price: Number(body.price) || 0,
      originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
      inventoryCount: Number(body.inventoryCount) || 0,
      isFeatured: Boolean(body.isFeatured),
      isNewArrival: Boolean(body.isNewArrival),
      referenceImages: body.referenceImages || undefined,
      details: body.details || undefined,
      // Persist SEO fields explicitly so admin overrides are saved to MongoDB.
      // If body.seo is undefined (old clients), this is a no-op.
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

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: productData },
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fire-and-forget: pre-warm all image variants for the updated product.
    // This runs in the background without blocking the admin response.
    const allImageUrls: string[] = [
      ...(Array.isArray(body.images) ? body.images : []),
      body.referenceImages?.front,
      body.referenceImages?.back,
      body.referenceImages?.left,
      body.referenceImages?.right,
    ].filter(Boolean) as string[];

    if (allImageUrls.length > 0) {
      Promise.allSettled(allImageUrls.map(url => preWarmGcsKey(url))).catch(() => {});
    }

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
  }
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const deletedProduct = await Product.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 });
  }
}
