import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Taxonomy from '@/models/Taxonomy';
import { requireAdmin } from '@/lib/auth';
import { invalidateCachePrefix } from '@/lib/serverCache';
import { checkAdminRateLimit } from '@/lib/media/rateLimit';
import { logAdminAction } from '@/lib/audit';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    await dbConnect();
    const data = await request.json();
    
    if (data.name && !data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const taxonomy = await Taxonomy.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    
    if (!taxonomy) {
      return NextResponse.json({ error: 'Taxonomy not found' }, { status: 404 });
    }

    invalidateCachePrefix('taxonomies:');

    await logAdminAction({
      actor_id: user?.userId,
      actor_email: user?.email,
      action: 'taxonomy.updated',
      target_type: 'taxonomy',
      target_id: id,
      meta: {
        name: taxonomy.name,
        type: taxonomy.type,
      },
      req: request,
    });
    
    return NextResponse.json(taxonomy);
  } catch (error: any) {
    console.error('Error updating taxonomy:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A taxonomy with this slug already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rl = await checkAdminRateLimit(request, 'adminSensitive');
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

    const { id } = await params;
    await dbConnect();
    const taxonomy = await Taxonomy.findByIdAndDelete(id);
    
    if (!taxonomy) {
      return NextResponse.json({ error: 'Taxonomy not found' }, { status: 404 });
    }

    invalidateCachePrefix('taxonomies:');

    await logAdminAction({
      actor_id: user?.userId,
      actor_email: user?.email,
      action: 'taxonomy.deleted',
      target_type: 'taxonomy',
      target_id: id,
      meta: {
        name: taxonomy.name,
        type: taxonomy.type,
      },
      req: request,
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting taxonomy:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
