export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import HomepageSection from '@/models/HomepageSection';
import { invalidateCachePrefix } from '@/lib/serverCache';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const page = request.nextUrl.searchParams.get('page') || 'home';
    const sections = await HomepageSection.find({ page }).lean();
    return NextResponse.json({ success: true, sections }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching homepage sections:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { checkAdminRateLimit } from '@/lib/media/rateLimit';
import { logAdminAction } from '@/lib/audit';

export async function POST(request: NextRequest) {  
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
    const body = await request.json();
    const { sectionType, content, page = 'home' } = body;

    if (!sectionType || !content) {
      return NextResponse.json({ success: false, error: 'Missing sectionType or content' }, { status: 400 });
    }

    // Upsert the section
    const section = await HomepageSection.findOneAndUpdate(
      { sectionType, page },
      { sectionType, content, page },
      { new: true, upsert: true }
    );

    // Invalidate the server-side cache so the next page request picks up fresh data
    invalidateCachePrefix('home:');

    await logAdminAction({
      actor_id: user?.userId,
      actor_email: user?.email,
      action: 'content.updated',
      target_type: 'content',
      meta: {
        sectionType,
        page,
      },
      req: request,
    });

    return NextResponse.json({ success: true, section }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving homepage section:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

