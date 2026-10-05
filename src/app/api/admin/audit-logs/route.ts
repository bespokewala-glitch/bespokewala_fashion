import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import AuditLog from '@/models/AuditLog';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireAdmin(request);
    if (errorResponse) return errorResponse;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)));
    const action = searchParams.get('action');
    const targetType = searchParams.get('target_type');
    const actorEmail = searchParams.get('actor_email');
    const q = searchParams.get('q');

    const filter: any = {};

    if (action) {
      filter.action = action;
    }
    if (targetType) {
      filter.target_type = targetType;
    }
    if (actorEmail) {
      filter.actor_email = { $regex: actorEmail.trim(), $options: 'i' };
    }
    if (q) {
      const term = q.trim();
      filter.$or = [
        { actor_email: { $regex: term, $options: 'i' } },
        { action: { $regex: term, $options: 'i' } },
        { target_id: { $regex: term, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Audit logs API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

