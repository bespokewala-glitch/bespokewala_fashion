export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Review from '@/models/Review';
import Order from '@/models/Order';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: productId } = params;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const sortParam = searchParams.get('sort') || 'recent';

    await dbConnect();

    const query = { 
      productId: new mongoose.Types.ObjectId(productId), 
      status: 'approved' 
    };

    let sortOption: any = { createdAt: -1 };
    if (sortParam === 'highest') sortOption = { rating: -1, createdAt: -1 };
    if (sortParam === 'lowest') sortOption = { rating: 1, createdAt: -1 };
    if (sortParam === 'helpful') sortOption = { helpfulCount: -1, createdAt: -1 };

    // Fetch pagination & data
    const skip = (page - 1) * limit;
    
    // Calculate total docs & aggregation for rating stats
    const [totalReviews, reviews, ratingStats] = await Promise.all([
      Review.countDocuments(query),
      Review.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name')
        .lean(),
      Review.aggregate([
        { $match: query },
        { 
          $group: { 
            _id: null, 
            averageRating: { $avg: '$rating' },
            total: { $sum: 1 },
            rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
            rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
          } 
        }
      ])
    ]);

    const stats = ratingStats.length > 0 ? ratingStats[0] : {
      averageRating: 0,
      total: 0,
      rating5: 0, rating4: 0, rating3: 0, rating2: 0, rating1: 0
    };

    return NextResponse.json({
      reviews: reviews.map(r => ({
        ...r,
        userName: (r.userId as any)?.name || 'Customer'
      })),
      stats: {
        averageRating: Number(stats.averageRating.toFixed(1)),
        totalReviews: stats.total,
        distribution: {
          5: stats.rating5,
          4: stats.rating4,
          3: stats.rating3,
          2: stats.rating2,
          1: stats.rating1
        }
      },
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalReviews / limit),
        total: totalReviews
      }
    });

  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: productId } = params;
    
    // Auth check
    const { user, errorResponse } = await requireAuth(request);
    if (errorResponse) {
      return errorResponse;
    }
    const userId = user.userId || user.id;

    const body = await request.json();
    const { rating, title, comment, images } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ message: 'Valid rating between 1 and 5 is required' }, { status: 400 });
    }
    if (!comment || comment.trim().length < 10) {
      return NextResponse.json({ message: 'Review comment must be at least 10 characters long' }, { status: 400 });
    }

    await dbConnect();

    // Check for duplicate reviews
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      return NextResponse.json({ message: 'You have already reviewed this product' }, { status: 400 });
    }

    // Verify purchase
    // We check if the user has an order containing this productId and its status is completed/shipped/delivered
    const validOrder = await Order.findOne({
      user: userId,
      'items.productId': productId,
      orderStatus: { $in: ['shipped', 'delivered', 'completed', 'dispatched', 'in_transit'] }
    });

    const verifiedPurchase = !!validOrder;
    const orderId = validOrder ? validOrder._id : undefined;

    const review = await Review.create({
      productId,
      userId,
      orderId,
      rating,
      title,
      comment,
      images: images || [],
      verifiedPurchase,
      status: 'pending' // Admin must approve it
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Review submitted successfully and is pending approval.',
      review
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error submitting review:', error);
    if (error.code === 11000) {
      return NextResponse.json({ message: 'You have already reviewed this product' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
