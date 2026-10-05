export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Cart from '@/models/Cart';

export async function GET(request: Request) {
  try {
    const { user, errorResponse } = await requireAuth(request);
    if (errorResponse) {
      return errorResponse;
    }
    const userId = user.id || user.userId;

    await dbConnect();
    let cart = await Cart.findOne({ userId });
    
    if (!cart) {
      console.log('[API Cart] GET Empty cart returned for', userId);
      return NextResponse.json({ items: [] });
    }

    console.log('[API Cart] GET Returning items for', userId, cart.items.length);
    return NextResponse.json({ items: cart.items });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: 'Unable to retrieve shopping bag. Please refresh or try again.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, errorResponse } = await requireAuth(request);
    if (errorResponse) {
      return errorResponse;
    }
    const userId = user.id || user.userId;

    const { items } = await request.json();
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items format' }, { status: 400 });
    }

    await dbConnect();
    
    // Find and update, or create if it doesn't exist
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { items },
      { new: true, upsert: true }
    );
    
    return NextResponse.json({ items: cart.items });
  } catch (error: any) {
    console.error('Error updating cart:', error.stack || error);
    return NextResponse.json({ error: 'Unable to update shopping bag. Please try again.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, errorResponse } = await requireAuth(request);
    if (errorResponse) {
      return errorResponse;
    }
    const userId = user.id || user.userId;

    await dbConnect();
    await Cart.findOneAndUpdate(
      { userId },
      { items: [] },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, items: [] });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json({ error: 'Unable to clear shopping bag.' }, { status: 500 });
  }
}

