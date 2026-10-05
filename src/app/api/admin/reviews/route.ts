import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Review from '@/models/Review';
import { requireAdmin } from '@/lib/auth';
import User from '@/models/User'; // Ensure User is registered

export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireAdmin(request);
    if (errorResponse) {
      return errorResponse;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    await dbConnect();

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [totalReviews, reviews] = await Promise.all([
      Review.countDocuments(query),
      Review.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .populate('productId', 'name slug')
        .lean()
    ]);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalReviews / limit),
        total: totalReviews
      }
    });

  } catch (error: any) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

