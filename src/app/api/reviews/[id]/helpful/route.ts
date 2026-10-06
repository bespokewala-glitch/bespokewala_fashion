export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Review from '@/models/Review';
import { requireAuth } from '@/lib/auth';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: reviewId } = params;
    
    // Auth check
    const { user, errorResponse } = await requireAuth(request);
    if (errorResponse) {
      return errorResponse;
    }
    const userId = user.userId || user.id;

    await dbConnect();

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ message: 'Review not found' }, { status: 404 });
    }

    // Check if user already voted
    if (review.votedBy.includes(userId)) {
      return NextResponse.json({ message: 'You have already marked this review as helpful' }, { status: 400 });
    }

    review.helpfulCount += 1;
    review.votedBy.push(userId);
    await review.save();

    return NextResponse.json({ 
      success: true, 
      helpfulCount: review.helpfulCount 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating helpful count:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
