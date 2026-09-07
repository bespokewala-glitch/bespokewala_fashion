export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongoose';
import Cart from '@/models/Cart';

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  let userId = payload?.userId || payload?.id;
  
  if (userId && typeof userId === 'object' && userId.buffer) {
    // Recover ObjectId hex string from serialized Buffer object
    userId = Buffer.from(Object.values(userId.buffer)).toString('hex');
  } else if (userId) {
    userId = userId.toString();
  }
  
  return userId || null;
}

export async function GET() {
  console.log('[API Cart] GET request received');
  try {
    const userId = await getUserId();
    if (!userId) {
      console.log('[API Cart] GET Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('[API Cart] POST request received');
  try {
    const userId = await getUserId();
    if (!userId) {
      console.log('[API Cart] POST Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items } = await request.json();
    console.log('[API Cart] POST items received for', userId, items.length);
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
    
    console.log('[API Cart] POST updated successfully');
    return NextResponse.json({ items: cart.items });
  } catch (error: any) {
    console.error('Error updating cart:', error.stack || error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    await Cart.findOneAndUpdate(
      { userId },
      { items: [] },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, items: [] });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
