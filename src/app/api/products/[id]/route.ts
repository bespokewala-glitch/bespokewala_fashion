export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Product from '@/models/Product';
import { IProduct } from '@/types/product';
import { preWarmGcsKey } from '@/lib/preWarmVariants';
import { invalidateCachePrefix } from '@/lib/serverCache';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';


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

import { checkAdminRateLimit } from '@/lib/media/rateLimit';
import { logAdminAction } from '@/lib/audit';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = await checkAdminRateLimit(req, 'adminAction');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      );
    }

    const { errorResponse, user } = await requireAdmin(req);
    if (errorResponse) {
      return errorResponse;
    }

    await dbConnect();
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const body = await req.json();

    if (body.price !== undefined) {
      const p = Number(body.price);
      if (isNaN(p) || p < 0) {
        return NextResponse.json({ error: 'Price must be a valid non-negative number' }, { status: 400 });
      }
    }

    if (body.inventoryCount !== undefined) {
      const inv = Number(body.inventoryCount);
      if (isNaN(inv) || inv < 0) {
        return NextResponse.json({ error: 'Inventory count must be a non-negative number' }, { status: 400 });
      }
    }
    
    const productData: Partial<IProduct> = {
      ...body,
      images: Array.isArray(body.images) ? body.images : (body.images ? [body.images] : []),
      sizes: Array.isArray(body.sizes) ? body.sizes : [],
      colors: Array.isArray(body.colors) ? body.colors : [],
      subcategory: body.subcategory || 'general',
      price: body.price !== undefined ? Number(body.price) : undefined,
      originalPrice: body.originalPrice !== undefined ? (body.originalPrice ? Number(body.originalPrice) : undefined) : undefined,
      inventoryCount: body.inventoryCount !== undefined ? Number(body.inventoryCount) : undefined,
      isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : undefined,
      isNewArrival: body.isNewArrival !== undefined ? Boolean(body.isNewArrival) : undefined,
      referenceImages: body.referenceImages || undefined,
      details: body.details || undefined,
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

    // Remove undefined values to avoid overwriting existing properties unintendedly
    Object.keys(productData).forEach(key => (productData as any)[key] === undefined && delete (productData as any)[key]);

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: productData },
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Audit log
    await logAdminAction({
      actor_id: user?.userId,
      actor_email: user?.email,
      action: 'product.updated',
      target_type: 'product',
      target_id: id,
      meta: {
        name: updatedProduct.name,
        price: updatedProduct.price,
        inventoryCount: updatedProduct.inventoryCount,
      },
      req,
    });

    // Fire-and-forget: pre-warm all image variants for the updated product.
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

    // Invalidate caches so frontend sees updates immediately
    invalidateCachePrefix('product:');
    invalidateCachePrefix('products:');
    invalidateCachePrefix('home:');
    revalidatePath('/', 'layout');

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = await checkAdminRateLimit(req, 'adminSensitive');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      );
    }

    const { errorResponse, user } = await requireAdmin(req);
    if (errorResponse) {
      return errorResponse;
    }

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

    // Audit log
    await logAdminAction({
      actor_id: user?.userId,
      actor_email: user?.email,
      action: 'product.deleted',
      target_type: 'product',
      target_id: id,
      meta: {
        name: deletedProduct.name,
        slug: deletedProduct.slug,
      },
      req,
    });
    
    // Invalidate caches so frontend sees updates immediately
    invalidateCachePrefix('product:');
    invalidateCachePrefix('products:');
    invalidateCachePrefix('home:');
    revalidatePath('/', 'layout');

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
