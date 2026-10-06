export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import HeroCampaign from '@/models/HeroCampaign';
import { invalidateCachePrefix } from '@/lib/serverCache';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { checkAdminRateLimit } from '@/lib/media/rateLimit';
import { logAdminAction } from '@/lib/audit';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    await dbConnect();
    
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'No ID provided' }, { status: 400 });
    }

    const deletedCampaign = await HeroCampaign.findByIdAndDelete(id);
    
    if (!deletedCampaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    // Invalidate caches so frontend updates instantly
    invalidateCachePrefix('home:campaigns');
    revalidatePath('/');

    await logAdminAction({
      actor_id: user?.userId,
      actor_email: user?.email,
      action: 'content.deleted',
      target_type: 'content',
      target_id: id,
      meta: {
        title: deletedCampaign.title,
      },
      req: request,
    });

    return NextResponse.json({ success: true, message: 'Campaign deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'No ID provided' }, { status: 400 });
    }

    const body = await request.json();
    
    const updatedCampaign = await HeroCampaign.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );
    
    if (!updatedCampaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    // Invalidate caches so frontend updates instantly
    invalidateCachePrefix('home:campaigns');
    revalidatePath('/');

    await logAdminAction({
      actor_id: user?.userId,
      actor_email: user?.email,
      action: 'content.updated',
      target_type: 'content',
      target_id: id,
      meta: {
        title: updatedCampaign.title,
      },
      req: request,
    });

    return NextResponse.json({ success: true, campaign: updatedCampaign }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
