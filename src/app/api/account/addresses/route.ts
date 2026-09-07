import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  let userId = payload?.userId || payload?.id;
  
  if (userId && typeof userId === 'object' && userId.buffer) {
    userId = Buffer.from(Object.values(userId.buffer)).toString('hex');
  } else if (userId) {
    userId = userId.toString();
  }
  
  return userId || null;
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(userId).select('addresses');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ addresses: user.addresses || [] });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'country', 'phone'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    await dbConnect();
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Initialize addresses array if it doesn't exist
    if (!user.addresses) {
      user.addresses = [];
    }

    // If this is the first address or isDefault is true, manage defaults
    const isFirstAddress = user.addresses.length === 0;
    const shouldBeDefault = isFirstAddress || data.isDefault;

    if (shouldBeDefault) {
      user.addresses.forEach((addr: any) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      ...data,
      isDefault: shouldBeDefault
    });

    await user.save();

    return NextResponse.json({ 
      message: 'Address added successfully', 
      addresses: user.addresses 
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error adding address:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
