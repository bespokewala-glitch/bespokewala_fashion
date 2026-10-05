import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import HeroCampaign from '@/models/HeroCampaign';
import { invalidateCachePrefix } from '@/lib/serverCache';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    const campaigns = await HeroCampaign.find({}).sort({ order: 1 });
    return NextResponse.json({ success: true, campaigns }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

import { checkAdminRateLimit } from '@/lib/media/rateLimit';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest) {
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
    const body = await req.json();
    
    // Simple logic to set order if not provided
    if (body.order === undefined) {
      const count = await HeroCampaign.countDocuments();
      body.order = count;
    }
    
    const campaign = await HeroCampaign.create(body);
    
    // Invalidate caches so frontend updates instantly
    invalidateCachePrefix('home:campaigns');
    revalidatePath('/');

    await logAdminAction({
      actor_id: user?.userId,
      actor_email: user?.email,
      action: 'content.created',
      target_type: 'content',
      target_id: campaign._id.toString(),
      meta: {
        title: campaign.title,
        order: campaign.order,
      },
      req,
    });
    
    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

